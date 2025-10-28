<?php
// php/api/login.php
header('Content-Type: application/json; charset=utf-8');

require_once 'PdoMethods.php';

try {
    $data = [];
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) $data = $json;

    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if ($username === '' || $password === '') {
        echo json_encode(['success' => false, 'errors' => ['general' => 'Username and password required']]);
        exit;
    }

    $pdo = new PdoMethods();
    $sql = "SELECT username, password, screenName FROM users WHERE username = :username LIMIT 1";
    $bindings = [
        [':username', $username, 'str']
    ];
    $rows = $pdo->selectBinded($sql, $bindings);
    if ($rows === 'error') {
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit;
    }
    if (empty($rows)) {
        echo json_encode(['success' => false, 'errors' => ['general' => 'Invalid credentials']]);
        exit;
    }

    $row = $rows[0];
    if (!password_verify($password, $row['password'])) {
        echo json_encode(['success' => false, 'errors' => ['general' => 'Invalid credentials']]);
        exit;
    }

    // login success
    session_start();
    $_SESSION['username'] = $row['username'];
    $_SESSION['screenName'] = $row['screenName'];

    echo json_encode(['success' => true, 'message' => 'Login successful', 'screenName' => $row['screenName']]);
    exit;

} catch (Exception $e) {
    error_log("login exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
