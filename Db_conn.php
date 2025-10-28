<?php
// php/Db_conn.php
class DatabaseConn {
  private $conn;

  public function dbOpen(){
    try {
      $dbHost = 'localhost';
      $dbName = '436db';
      $dbUsr  = '436_mysql_user';
      $dbPass = '123pwd456';

      // Use utf8mb4 for full unicode support
      $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
      $this->conn = new PDO($dsn, $dbUsr, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
      ]);

      return $this->conn;
    }
    catch (PDOException $e) {
      // In production, log the error instead of echoing
      error_log("DB connection error: " . $e->getMessage());
      throw $e;
    }
  }
}
