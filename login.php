<?php
session_start();
include "db.php";

$email = $_POST['email'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE email='$email'";
$res = mysqli_query($conn, $sql);

if (mysqli_num_rows($res) === 1) {
    $row = mysqli_fetch_assoc($res);

    if (password_verify($password, $row['password'])) {
        $_SESSION['user'] = $row['email'];   // save session
        echo "success";
    } else {
        echo "wrong";
    }
} else {
    echo "notfound";
}
?>
