<?php
// Test configuration and database connection
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/koneksi.php';

$status = [
  'database_connected' => false,
  'tables_exist' => [],
  'sample_user' => null,
  'error' => null
];

// Test database connection
if (isset($conn) && $conn) {
  $status['database_connected'] = true;
  
  // Check tables
  $tables = ['users', 'mahasiswa', 'dosen', 'mata_kuliah', 'enrollment', 'tendik'];
  foreach ($tables as $table) {
    $result = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
    $status['tables_exist'][$table] = mysqli_num_rows($result) > 0;
  }
  
  // Get sample user
  $result = mysqli_query($conn, "SELECT id, username, role FROM users LIMIT 1");
  if ($result && mysqli_num_rows($result) > 0) {
    $status['sample_user'] = mysqli_fetch_assoc($result);
  }
} else {
  $status['error'] = 'Database connection failed: ' . mysqli_connect_error();
}

http_response_code(200);
echo json_encode($status, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
