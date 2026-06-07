<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/../config/koneksi.php';
if (!isset($conn) || !$conn) {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code(500);
  echo json_encode(['error' => 'Database connection failed.']);
  exit;
}

function send_json(mixed $data, int $status = 200) {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function get_raw_input(): string {
  return file_get_contents('php://input');
}

function get_input(): array {
  $raw = get_raw_input();
  $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
  if (stripos($contentType, 'application/json') !== false) {
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }
  parse_str($raw, $parsed);
  return !empty($parsed) ? $parsed : $_POST;
}

function escape(string|int|float|bool|null $value): string {
  global $conn;
  return mysqli_real_escape_string($conn, (string) $value);
}

function query_fetch_all(string $sql): array {
  global $conn;
  $result = mysqli_query($conn, $sql);
  if ($result === false) {
    send_json(['error' => mysqli_error($conn)], 500);
  }
  $rows = [];
  while ($row = mysqli_fetch_assoc($result)) {
    $rows[] = $row;
  }
  return $rows;
}

function query_fetch_one(string $sql): ?array {
  $rows = query_fetch_all($sql);
  return $rows[0] ?? null;
}

function method_not_allowed(array $allowed) {
  header('Allow: ' . implode(', ', $allowed));
  send_json(['error' => 'Method not allowed. Use: ' . implode(', ', $allowed)], 405);
}

function not_found($message = 'Resource not found.') {
  send_json(['error' => $message], 404);
}

function get_current_user(): ?array {
  $username = $_SERVER['HTTP_X_USERNAME'] ?? null;
  if (!$username) {
    return null;
  }
  
  $username = escape($username);
  $user = query_fetch_one("SELECT id, username, role FROM users WHERE username = '$username' LIMIT 1");
  return $user;
}

function get_dosen_id_from_username(string $username): ?int {
  $username = escape($username);
  $dosen = query_fetch_one("SELECT id FROM dosen WHERE nip = '$username'");
  return $dosen ? (int)$dosen['id'] : null;
}
