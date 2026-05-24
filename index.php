<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$path = substr($requestUri, strlen($scriptName));
$path = trim($path, '/');

if ($path === '') {
  require __DIR__ . '/api/index.php';
  exit;
}

if (str_starts_with($path, 'api/')) {
  $path = substr($path, strlen('api/'));
}

$allowed = ['login', 'mahasiswa', 'dosen', 'matakuliah', 'enrollment', 'profile', 'password', 'laporan'];
$resource = explode('/', $path)[0];

if (!in_array($resource, $allowed, true)) {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code(404);
  echo json_encode(['error' => 'Endpoint not found.', 'requested' => $path], JSON_UNESCAPED_UNICODE);
  exit;
}

$apiFile = __DIR__ . '/api/' . basename($resource) . '.php';
if (file_exists($apiFile)) {
  require $apiFile;
  exit;
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(404);
echo json_encode(['error' => 'API file not found.', 'file' => $apiFile], JSON_UNESCAPED_UNICODE);
exit;
