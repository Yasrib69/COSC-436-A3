<?php
declare(strict_types=1);
session_name('CHATLABSESSID');
session_start();

header('Content-Type: application/json');
require __DIR__.'/Db_conn.php';
require __DIR__.'/PdoMethods.php';

$pdoh = new PdoMethods($pdo);
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$username   = trim((string)($input['username']    ?? ''));
$screenName = trim((string)($input['screenName']  ?? ''));
$password   = (string)($input['password']         ?? '');

$errors = [];
if ($username === '')   $errors['username']   = 'Username is required';
if ($screenName === '') $errors['screenName'] = 'Screen name is required';
if ($password === '' || strlen($password) < 6) $errors['password'] = 'Password must be 6+ chars';

if ($errors) { echo json_encode(['success'=>false,'errors'=>$errors]); exit; }

if ($pdoh->fetchOne('SELECT 1 FROM users WHERE username=?', [$username])) {
  echo json_encode(['success'=>false,'errors'=>['username'=>'Username already exists']]); exit;
}
if ($pdoh->fetchOne('SELECT 1 FROM users WHERE screenName=?', [$screenName])) {
  echo json_encode(['success'=>false,'errors'=>['screenName'=>'Screen name already exists']]); exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$pdoh->exec('INSERT INTO users (username, passwordHash, screenName) VALUES (?, ?, ?)', [$username, $hash, $screenName]);

$_SESSION['username'] = $username;
$_SESSION['screenName'] = $screenName;

echo json_encode(['success'=>true,'message'=>'Signup successful','screenName'=>$screenName]);
