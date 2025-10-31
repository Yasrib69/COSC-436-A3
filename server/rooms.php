<?php
// server/rooms.php
header('Content-Type: application/json');

// Tiny persistence (single-machine)
$store = sys_get_temp_dir() . '/chatrooms.json';
if (!file_exists($store)) {
  file_put_contents($store, json_encode([['name'=>'General','locked'=>false]], JSON_PRETTY_PRINT));
}

$rooms = json_decode(@file_get_contents($store), true) ?: [];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  echo json_encode(['rooms' => $rooms]);
  exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true) ?? [];
  $action = $data['action'] ?? '';
  if ($action === 'create') {
    $name = trim($data['name'] ?? '');
    $locked = isset($data['key']) && $data['key'] !== '';
    if ($name !== '' && !array_filter($rooms, fn($r)=>strcasecmp($r['name'],$name)===0)) {
      $rooms[] = ['name'=>$name, 'locked'=>$locked];
      file_put_contents($store, json_encode($rooms, JSON_PRETTY_PRINT));
    }
    echo json_encode(['ok'=>true]); exit;
  }
  if ($action === 'join') {
    // no server-side tracking required for this UI; WS handles membership
    echo json_encode(['ok'=>true]); exit;
  }
}

http_response_code(405);
echo json_encode(['error'=>'Method not allowed']);
