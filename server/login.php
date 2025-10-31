<?php
declare(strict_types=1);
session_name('CHATLABSESSID');
session_start();

header('Content-Type: application/json');
require __DIR__.'/Db_conn.php';
require __DIR__.'/PdoMethods.php';

$pdoh = new PdoMethods($pdo);
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
  echo json_encode(['success'=>false,'message'=>'username and password required']); exit;
}

$row = $pdoh->fetchOne('SELECT * FROM users WHERE username=?', [$username]);
if (!$row || !password_verify($password, $row['passwordHash'])) {
  echo json_encode(['success'=>false,'message'=>'Invalid credentials']); exit;
}

$_SESSION['username'] = $row['username'];
$_SESSION['screenName'] = $row['screenName'];

echo json_encode(['success'=>true,'message'=>'Login successful','screenName'=>$row['screenName']]);
