<?php
require_once __DIR__ . '/base.php';

define('DEFAULT_USER_PASSWORD', 'password');

function ensure_user(string $username, string $role): void {
  global $conn;
  $username = escape($username);
  $userExists = query_fetch_one("SELECT id FROM users WHERE username = '$username'");
  if (!$userExists) {
    $hash = password_hash(DEFAULT_USER_PASSWORD, PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('$username', '$hash', '$role')");
  }
}
