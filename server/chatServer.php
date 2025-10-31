<?php
/* server/chatServer.php — room-aware WebSocket with logging */
$host = '0.0.0.0';
$port = 8080;

function logline($s){ fwrite(STDERR, date('H:i:s')." ".$s."\n"); }

$server = @stream_socket_server("tcp://$host:$port", $errno, $errstr);
if (!$server) {
    logline("Server error: $errstr ($errno)");
    exit(1);
}
stream_set_blocking($server, false);
logline("WebSocket server on $host:$port");

$clients = []; // id => ['sock'=>resource,'handshaked'=>bool,'screenName'=>?,'room'=>?]
$buffers = [];

function makeId($sock){ return (int)$sock; }

function wsHandshake($sock, $headers){
    if (!preg_match('/Sec-WebSocket-Key:\s*(.*)\r\n/i', $headers, $m)) return false;
    $key = trim($m[1]);
    $accept = base64_encode(sha1($key.'258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
    $out  = "HTTP/1.1 101 Switching Protocols\r\n";
    $out .= "Upgrade: websocket\r\n";
    $out .= "Connection: Upgrade\r\n";
    $out .= "Sec-WebSocket-Accept: $accept\r\n\r\n";
    fwrite($sock, $out);
    return true;
}
function wsEncode($payload){
    $b1 = 0x81; $len = strlen($payload);
    if ($len <= 125) return chr($b1).chr($len).$payload;
    if ($len <= 65535) return chr($b1).chr(126).pack('n',$len).$payload;
    return chr($b1).chr(127).pack('J',$len).$payload;
}
function wsDecodeOnce($buf){
    if (strlen($buf) < 2) return [null, 0];
    $b1 = ord($buf[0]); $b2 = ord($buf[1]);
    $masked = ($b2 & 0x80) === 0x80;
    $len = ($b2 & 0x7f);
    $idx = 2;
    if ($len === 126) { if (strlen($buf) < 4) return [null,0]; $len = (ord($buf[2])<<8) + ord($buf[3]); $idx = 4; }
    elseif ($len === 127) { if (strlen($buf) < 10) return [null,0]; $len = 0; for($i=0;$i<8;$i++) $len = ($len<<8)+ord($buf[2+$i]); $idx = 10; }
    if ($masked) { if (strlen($buf) < $idx+4) return [null,0]; $mask = substr($buf, $idx, 4); $idx += 4; }
    if (strlen($buf) < $idx+$len) return [null,0];
    $payload = substr($buf, $idx, $len);
    if ($masked) { $unm = ''; for($i=0;$i<$len;$i++) $unm .= $payload[$i] ^ $mask[$i%4]; $payload = $unm; }
    $opcode = $b1 & 0x0f;
    return [['opcode'=>$opcode,'payload'=>$payload], $idx+$len];
}
function broadcastRoom(&$clients, $room, $json, $exceptId=null){
    $frame = wsEncode($json);
    foreach ($clients as $id=>$c){
        if (($c['room']??null) !== $room) continue;
        if ($exceptId !== null && $exceptId === $id) continue;
        @fwrite($c['sock'], $frame);
    }
}

while (true){
    $read = [$server]; foreach ($clients as $c) $read[] = $c['sock'];
    $write = $except = null;
    @stream_select($read, $write, $except, 1, 0);

    if (in_array($server, $read, true)){
        $sock = @stream_socket_accept($server, 0);
        if ($sock){
            stream_set_blocking($sock, false);
            $id = makeId($sock);
            $clients[$id] = ['sock'=>$sock,'handshaked'=>false];
            $buffers[$id] = '';
            logline("Client #$id connected");
        }
        $read = array_diff($read, [$server]);
    }

    foreach ($read as $sock){
        $id = makeId($sock);
        $chunk = @fread($sock, 8192);
        if ($chunk === '' || $chunk === false){
            logline("Client #$id disconnected");
            @fclose($sock); unset($clients[$id], $buffers[$id]); continue;
        }
        $buffers[$id] .= $chunk;

        if (!$clients[$id]['handshaked']){
            if (strpos($buffers[$id], "\r\n\r\n") !== false){
                $hdr = $buffers[$id]; $buffers[$id] = '';
                if (wsHandshake($sock, $hdr)){ $clients[$id]['handshaked']=true; logline("Client #$id handshaked"); }
                else { @fclose($sock); unset($clients[$id], $buffers[$id]); }
            }
            continue;
        }

        // parse frames in buffer
        while (true){
            [$frame, $consumed] = wsDecodeOnce($buffers[$id]);
            if (!$frame) break;
            $buffers[$id] = substr($buffers[$id], $consumed);
            if ($frame['opcode'] === 0x8){ logline("Client #$id sent close"); @fclose($sock); unset($clients[$id], $buffers[$id]); break; }
            if ($frame['opcode'] !== 0x1) continue;

            $msg = json_decode($frame['payload'], true);
            if (!is_array($msg)) continue;

            $type = $msg['type'] ?? '';
            $name = $msg['screenName'] ?? ($clients[$id]['screenName'] ?? 'Unknown');
            $room = $msg['room'] ?? ($clients[$id]['room'] ?? null);

            if ($type === 'hello'){
                $clients[$id]['screenName'] = $name;
                logline("Client #$id hello as $name");
                continue;
            }
            if ($type === 'ping'){ /* ignore */ continue; }

            if ($type === 'join' && $room){
                $clients[$id]['screenName'] = $name;
                $clients[$id]['room'] = $room;
                logline("Client #$id ($name) joined room '$room'");
                $notice = json_encode(['type'=>'system','room'=>$room,'notice'=>"$name joined"]);
                broadcastRoom($clients, $room, $notice, null);
                continue;
            }

            if ($type === 'message' && $room && ($clients[$id]['room']??null) === $room){
                $text = (string)($msg['text'] ?? '');
                if ($text !== ''){
                    logline("[$room] $name: $text");
                    $out = json_encode(['type'=>'message','room'=>$room,'screenName'=>$name,'text'=>$text]);
                    broadcastRoom($clients, $room, $out, $id);
                }
            }
        }
    }
}
