<?php
// php/Validation.php
class Validation {
    private $error = false;

    public function checkFormat($value, $regex) {
        switch($regex){
            case "name": return $this->name($value); break;
            case "address": return $this->address($value); break;
            case "city": return $this->city($value); break;
            case "phone": return $this->phone($value); break;
            case "email": return $this->email($value); break;
            case "dob": return $this->dob($value); break;
            case "password": return $this->password($value); break;
            default: return "something wrong"; break;
        }
    }

    private function name($value){
        $match = preg_match('/^[a-zA-Z\' -]+$/', $value);
        return $this->setError($match);
    }

    private function address($value){
        $match = preg_match('/^\d+\s.*[a-zA-Z]$/', $value);
        return $this->setError($match);
    }

    private function city($value){
        $match = preg_match('/^[a-zA-Z\s]+$/', $value);
        return $this->setError($match);
    }

    private function phone($value){
        $match = preg_match('/\d{3}\.\d{3}.\d{4}/', $value);
        return $this->setError($match);
    }

    private function dob($value){
        $match = preg_match('/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/', $value);
        return $this->setError($match);
    }

    private function email($value){
        $match = preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $value);
        return $this->setError($match);
    }

    private function password($value){
        $match = preg_match('/^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/', $value);
        return $this->setError($match);
    }

    private function setError($match){
        if(!$match){
            $this->error = true;
            return "error";
        } else {
            return "";
        }
    }

    public function checkErrors(){
        return $this->error;
    }
}
