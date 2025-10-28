<?php
// php/PdoMethods.php
require_once __DIR__ . '/Db_conn.php';

class PdoMethods extends DatabaseConn {

    private $sth;
    private $conn;

    // SELECT with bound params
    public function selectBinded(string $sql, array $bindings) {
        try {
            $this->db_connection();
            $this->sth = $this->conn->prepare($sql);
            $this->createBinding($bindings);
            $this->sth->execute();
            $result = $this->sth->fetchAll(PDO::FETCH_ASSOC);
            $this->conn = null;
            return $result;
        } catch (PDOException $e) {
            error_log("selectBinded error: " . $e->getMessage());
            return 'error';
        }
    }

    // SELECT without bindings
    public function selectNotBinded(string $sql) {
        try {
            $this->db_connection();
            $this->sth = $this->conn->prepare($sql);
            $this->sth->execute();
            $result = $this->sth->fetchAll(PDO::FETCH_ASSOC);
            $this->conn = null;
            return $result;
        } catch (PDOException $e) {
            error_log("selectNotBinded error: " . $e->getMessage());
            return 'error';
        }
    }

    // INSERT/UPDATE/DELETE with bindings
    public function otherBinded(string $sql, array $bindings) {
        try {
            $this->db_connection();
            $this->sth = $this->conn->prepare($sql);
            $this->createBinding($bindings);
            $this->sth->execute();
            $this->conn = null;
            return 'noerror';
        } catch (PDOException $e) {
            error_log("otherBinded error: " . $e->getMessage());
            return 'error';
        }
    }

    // INSERT/UPDATE/DELETE without bindings
    public function otherNotBinded(string $sql) {
        try {
            $this->db_connection();
            $this->sth = $this->conn->prepare($sql);
            $this->sth->execute();
            $this->conn = null;
            return 'noerror';
        } catch (PDOException $e) {
            error_log("otherNotBinded error: " . $e->getMessage());
            return 'error';
        }
    }

    // private helpers
    private function db_connection() {
        $this->conn = $this->dbOpen();
    }

    /**
     * Bindings array format:
     * [
     *   [":param", $value, "str"],
     *   [":id", $id, "int"]
     * ]
     */
    private function createBinding(array $bindings) {
        foreach ($bindings as $value) {
            // defensive checks
            if (!isset($value[0]) || !isset($value[1]) || !isset($value[2])) {
                continue;
            }
            $param = $value[0];
            $val   = $value[1];
            $type  = $value[2];

            switch ($type) {
                case "str":
                    $this->sth->bindValue($param, $val, PDO::PARAM_STR);
                    break;
                case "int":
                    $this->sth->bindValue($param, $val, PDO::PARAM_INT);
                    break;
                default:
                    $this->sth->bindValue($param, $val);
                    break;
            }
        }
    }
}
