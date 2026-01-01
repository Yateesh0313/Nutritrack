<?php
session_start();
include "db.php";

$email = $_POST['email'];
$password = $_POST['password'];

// Hash password
$hashed = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$sql = "INSERT INTO users (email, password) VALUES ('$email', '$hashed')";

if (mysqli_query($conn, $sql)) {
    echo "success";
} else {
    echo "error";
}
?>
