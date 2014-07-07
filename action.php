<?php
	$action = "";
	if (isset($_GET['action'])) $action = $_GET['action'];
	if ($action == "teams") {
		$userid = "";
		if (isset($_GET['userid'])) $userid = $_GET['userid'];
		if ($userid) {
			echo file_get_contents("./teams/" . $userid . ".txt");
		}
	}
	if ($action == "save") {
		$userid = "";
		if (isset($_GET['userid'])) $userid = $_GET['userid'];
		if ($userid) {
			$t = $_GET['teams'];
			file_put_contents("./teams/" . $userid . ".txt", $t);
		}
	}