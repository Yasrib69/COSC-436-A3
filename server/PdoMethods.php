<?php
declare(strict_types=1);

class PdoMethods {
  private PDO $pdo;
  public function __construct(PDO $pdo) { $this->pdo = $pdo; }

  public function fetchOne(string $sql, array $params = []) : ?array {
    $st = $this->pdo->prepare($sql); $st->execute($params);
    $row = $st->fetch();
    return $row ?: null;
  }

  public function fetchAll(string $sql, array $params = []) : array {
    $st = $this->pdo->prepare($sql); $st->execute($params);
    return $st->fetchAll();
  }

  public function exec(string $sql, array $params = []) : int {
    $st = $this->pdo->prepare($sql); $st->execute($params);
    return (int)$st->rowCount();
  }
}
