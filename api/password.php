<?php
require_once __DIR__ . '/base.php';
global $conn;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  method_not_allowed(['POST']);
}

$data = get_input();
$username = trim($data['username'] ?? '');
$current = $data['current_password'] ?? '';
$new = $data['new_password'] ?? '';

if ($username === '' || $current === '' || $new === '') {
  send_json(['error' => 'Username, current_password, dan new_password diperlukan.'], 400);
}

$username = escape($username);
$user = query_fetch_one("SELECT * FROM users WHERE username = '$username' LIMIT 1");
if (!$user) {
  send_json(['error' => 'User tidak ditemukan.'], 404);
}

$isValid = password_verify($current, $user['password']) || $current === $user['password'];
if (!$isValid) {
  send_json(['error' => 'Password lama tidak cocok.'], 401);
}

$hash = password_hash($new, PASSWORD_DEFAULT);
if (!mysqli_query($conn, "UPDATE users SET password = '$hash' WHERE username = '$username'")) {
  send_json(['error' => mysqli_error($conn)], 500);
}

send_json(['success' => true]);
