<?php
// php/api/signup.php
header('Content-Type: application/json; charset=utf-8');

require_once 'PdoMethods.php';

try {
    $data = [];
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) $data = $json;

    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $screenName = trim($data['screenName'] ?? '');

    $errors = [];

    if ($username === '') $errors['username'] = 'Username required';
    if ($screenName === '') $errors['screenName'] = 'Screen name required';
    if ($password === '' || strlen($password) < 6) $errors['password'] = 'Password required (min 6 chars)';

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    $pdo = new PdoMethods();

    // check username uniqueness
    $sql = "SELECT username, screenName FROM users WHERE username = :username OR screenName = :screenName";
    $bindings = [
        [':username', $username, 'str'],
        [':screenName', $screenName, 'str']
    ];
    $existing = $pdo->selectBinded($sql, $bindings);
    if ($existing === 'error') {
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit;
    }
    if (!empty($existing)) {
        foreach ($existing as $row) {
            if ($row['username'] === $username) $errors['username'] = 'Username taken';
            if ($row['screenName'] === $screenName) $errors['screenName'] = 'Screen name taken';
        }
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    // insert user
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $insertSql = "INSERT INTO users (username, password, screenName) VALUES (:username, :password, :screenName)";
    $insertBindings = [
        [':username', $username, 'str'],
        [':password', $hash, 'str'],
        [':screenName', $screenName, 'str']
    ];
    $res = $pdo->otherBinded($insertSql, $insertBindings);
    if ($res === 'error') {
        echo json_encode(['success' => false, 'message' => 'Failed to insert user']);
        exit;
    }

    // Start session and log user in
    session_start();
    $_SESSION['username'] = $username;
    $_SESSION['screenName'] = $screenName;

    echo json_encode(['success' => true, 'message' => 'Signup successful', 'screenName' => $screenName]);
    exit;

} catch (Exception $e) {
    error_log("signup exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
    exit;
}
