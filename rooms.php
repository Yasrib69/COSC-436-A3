<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'PdoMethods.php';

$pdo = new PdoMethods();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return all rooms: name, key
    $sql = "SELECT chatroomName, chatroomKey FROM list_of_chatrooms ORDER BY chatroomName ASC";
    $res = $pdo->selectNotBinded($sql);

    $rooms = [];
    if ($res && is_array($res)) {
        foreach ($res as $r) {
            $rooms[] = [
                'name' => $r['chatroomName'],
                'key' => $r['chatroomKey']
            ];
        }
    }

    echo json_encode(['rooms' => $rooms]);
    exit;
}
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (isset($data['action']) && $data['action'] === 'joinRoom') {
        $roomName   = trim($data['roomName'] ?? '');
        $keyProvided = trim($data['key'] ?? '');
    
        if (!$roomName) {
            echo json_encode(['success' => false, 'message' => 'Missing room name']);
            exit;
        }
    
        // Verify room exists and key
        $sql = "SELECT chatroomKey FROM list_of_chatrooms WHERE chatroomName = :name";
        $bindings = [[ ':name', $roomName, 'str' ]];
        $res = $pdo->selectBinded($sql, $bindings);
    
        if (!$res) {
            echo json_encode(['success' => false, 'message' => 'Room does not exist']);
            exit;
        }
    
        $roomKey = $res[0]['chatroomKey'] ?? '';
    
        if ($roomKey && $roomKey !== $keyProvided) {
            echo json_encode(['success' => false, 'message' => 'Invalid room key']);
            exit;
        }
    
        // If all okay
        echo json_encode(['success' => true]);
        exit;
    }
    
    $name = isset($data['name']) ? trim($data['name']) : '';
    $key = isset($data['key']) ? trim($data['key']) : null;

    if ($name === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing room name or creator']);
        exit;
    }

    // check if exists
    $sql = "SELECT chatroomName FROM list_of_chatrooms WHERE LOWER(chatroomKey) = LOWER(:name)";
    $bindings = [
        [':name', $name, 'str']
    ];
    $exists = $pdo->selectBinded($sql, $bindings);
    if ($exists && count($exists) > 0) {
        echo json_encode(['success' => false, 'message' => 'Room name already taken']);
        exit;
    }

    // Insert (store NULL for empty key)
    $sql = "INSERT INTO list_of_chatrooms (chatroomName, chatroomKey) VALUES (:name, :key)";
    $bindings = [
        [':name', $name, 'str'],
        [':key', $key, 'str']
    ];
    $insertRes = $pdo->otherBinded($sql, $bindings);

    if ($insertRes == 'noerror') {
        echo json_encode(['success' => true, 'message' => 'Room created']);
    }
     else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $insertRes]);
    }
    exit;
}


