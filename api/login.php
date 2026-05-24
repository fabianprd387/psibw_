<?php
require_once __DIR__ . '/base.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  method_not_allowed(['POST']);
}

$data = get_input();
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if ($username === '' || $password === '') {
  send_json(['error' => 'Username and password are required.'], 400);
}

$username = escape($username);
$user = query_fetch_one("SELECT * FROM users WHERE username = '$username' LIMIT 1");
if (!$user) {
  send_json(['error' => 'Invalid credentials.'], 401);
}

$isValid = password_verify($password, $user['password']) || $password === $user['password'];
if (!$isValid) {
  send_json(['error' => 'Invalid credentials.'], 401);
}

unset($user['password']);
send_json(['success' => true, 'user' => $user]);
