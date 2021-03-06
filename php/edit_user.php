<?php
require 'include/DB.php';
require 'include/login.php';

$alert_msg = "";

if(isset($_POST['name']) && strlen($_POST['name']) < 3) {
	$alert_msg .= "必須輸入正確姓名！\n";
}

if(isset($_POST['email']) && !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
	$alert_msg .= "必須輸入正確Email！\n";
}

if(isset($_POST['password']) && !preg_match("/.{8,}/",$_POST['password'])) {
	$alert_msg .= "必須輸入正確密碼！\n";
}

$db = new DB();
$login = new Login($db);

if($alert_msg !== "") {
	die(json_encode(array("status" => "fail", "msg" => $alert_msg)));
}

$login->check();

unset($_POST['admin']);
echo json_encode($login->edit(null, $_POST) ? array("status" => "success") : array("status" => "fail"));
?>
