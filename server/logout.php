<?php
declare(strict_types=1);
session_name('CHATLABSESSID');
session_start();
header('Content-Type: application/json');

session_unset();
session_destroy();

echo json_encode(['success'=>true,'message'=>'Logged out']);
