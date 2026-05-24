<?php

$dbUrl = getenv('MYSQL_URL') ?: getenv('MYSQL_PUBLIC_URL');

if ($dbUrl) {
  $parsed = parse_url($dbUrl);
  $host = $parsed['host'] ?? 'localhost';
  $user = $parsed['user'] ?? 'root';
  $pass = $parsed['pass'] ?? '';
  $dbname = ltrim($parsed['path'] ?? '/siakad', '/');
  $port = $parsed['port'] ?? 3306;
} else {
  $host = getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: getenv('MYSQL_HOST') ?: 'localhost';
  $user = getenv('DB_USER') ?: getenv('MYSQLUSER') ?: getenv('MYSQL_USER') ?: 'root';
  $pass = getenv('DB_PASS') ?: getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: '';
  $dbname = getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE') ?: 'siakad';
  $port = getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: getenv('MYSQL_PORT') ?: 3306;
}


$port = is_numeric($port) ? (int) $port : 3306;

$conn = mysqli_connect($host, $user, $pass, $dbname, $port);

if (!$conn) {
  die("Koneksi gagal: " . mysqli_connect_error());
}