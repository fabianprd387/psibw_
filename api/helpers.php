<?php
require_once __DIR__ . '/base.php';

define('DEFAULT_USER_PASSWORD_LENGTH', 12);

define('DEFAULT_PASSWORD_CHARSET', 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()');

function generate_password(int $length = DEFAULT_USER_PASSWORD_LENGTH): string {
  $charset = DEFAULT_PASSWORD_CHARSET;
  $password = '';
  $max = strlen($charset) - 1;

  for ($i = 0; $i < $length; $i++) {
    $password .= $charset[random_int(0, $max)];
  }

  return $password;
}

function ensure_user(string $username, string $role): ?string {
  global $conn;
  $username = escape($username);
  $userExists = query_fetch_one("SELECT id FROM users WHERE username = '$username'");
  if ($userExists) {
    return null;
  }

  $plainPassword = generate_password();
  mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('$username', '$plainPassword', '$role')");

  return $plainPassword;
}
