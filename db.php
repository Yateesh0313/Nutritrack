<?php
$host = "localhost";
$user = "root";  // default for XAMPP
$pass = "";      // empty password
$db   = "nutritrack";

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    die("Database Connection Failed!");
}
?>
