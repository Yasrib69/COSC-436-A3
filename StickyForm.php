<?php
// php/StickyForm.php
require_once __DIR__ . '/Validation.php';
class StickyForm extends Validation {
    public function validateForm($GlobalPost, $elementsArr){
        foreach($elementsArr as $k=>$v){
            if($elementsArr[$k]['type'] == "text" || $elementsArr[$k]['type'] == "password"){
                $error = $this->checkFormat($GlobalPost[$k] ?? '', $elementsArr[$k]['regex'] ?? '');
                if($error == 'error'){
                    $elementsArr[$k]['errorOutput'] = $elementsArr[$k]['errorMessage'] ?? '';
                    $elementsArr['masterStatus']['status'] = "error";
                }
                $elementsArr[$k]['value'] = htmlentities($GlobalPost[$k] ?? '');
            } else if($elementsArr[$k]['type'] == "select"){
                $elementsArr[$k]['selected'] = $GlobalPost[$k] ?? '';
            } else if($elementsArr[$k]['type'] == 'checkbox' && isset($GlobalPost[$k])){
                if($elementsArr[$k]['action'] == "notRequired"){
                    foreach($elementsArr[$k]['status'] as $ek=>$ev){
                        foreach($GlobalPost[$k] as $gv){
                            if($ek == $gv){
                                $elementsArr[$k]['status'][$ek] = "checked";
                                break;
                            }
                        }
                    }
                }
            } else if($elementsArr[$k]['type'] == 'radio'){
                if($elementsArr[$k]['action'] == "required" && !isset($GlobalPost[$k])){
                    $elementsArr[$k]['errorOutput'] =  $elementsArr[$k]['errorMessage'];
                    $elementsArr['masterStatus']['status'] = "error";
                } else {
                    if(isset($GlobalPost[$k])){
                        foreach($elementsArr[$k]['value'] as $ek=>$ev){
                            if($GlobalPost[$k] == $ek){
                                $elementsArr[$k]['value'][$ek] = "checked";
                                break;
                            }
                        }
                    }   
                }
            }
        }
        return $elementsArr;
    }

    public function createOptions($elementsArr){
        $options = '';
        foreach($elementsArr['options'] as $k=>$v){
            if($elementsArr['selected'] == $k){
                $options .= "<option selected value=\"$k\">$v</option>";
            } else {
                $options .= "<option value=\"$k\">$v</option>";
            }
        }
        return $options;
    }
}
