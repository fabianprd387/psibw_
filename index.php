<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$path = substr($requestUri, strlen($scriptName));
$path = trim($path, '/');

if (str_starts_with($path, 'api/')) {
    $apiPath = substr($path, strlen('api/'));
    $allowed = ['login', 'mahasiswa', 'dosen', 'matakuliah', 'enrollment', 'profile', 'password', 'laporan', 'import'];
    $resource = explode('/', $apiPath)[0];

    if (in_array($resource, $allowed, true)) {
        $apiFile = __DIR__ . '/api/' . basename($resource) . '.php';
        if (file_exists($apiFile)) {
            require $apiFile;
            exit;
        }
    }
    
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint or API file not found.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($path === '') {
    $path = 'index.html';
}

$publicFile = __DIR__ . '/public/' . $path;
if (file_exists($publicFile) && !is_dir($publicFile)) {
    $ext = pathinfo($publicFile, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml'
    ];
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile($publicFile);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(404);
echo json_encode(['error' => 'Resource not found.', 'requested' => $path], JSON_UNESCAPED_UNICODE);
exit;