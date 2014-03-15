<?php
$alert_msg = "";

if(strlen($_POST['name']) < 3) {
	alert_msg .= "必須輸入正確姓名！\n";
}

if(!preg_match("/^[\w\-]+\@[\w\-]+\.[\w\-]+$/",$_POST['email'])) {
	alert_msg .= "必須輸入正確Email！\n";
}

if(!preg_match("/^[A-Za-z0-9_]{6,}$/",$_POST['username'])) {
	alert_msg .= "必須輸入正確使用者名稱！\n";
}

if(!preg_match("/.{8,}/",$_POST['password'])) {
	alert_msg .= "必須輸入正確密碼！\n";
}

if($alert_msg !== "") {
	die("alert({$alert_msg});");
}

?>