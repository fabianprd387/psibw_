<?php
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
  'message' => 'SIAKAD REST API',
  'endpoints' => [
    'POST /api/login.php',
    'GET /api/mahasiswa.php',
    'GET /api/mahasiswa.php?id={id}',
    'POST /api/mahasiswa.php',
    'PUT /api/mahasiswa.php?id={id}',
    'DELETE /api/mahasiswa.php?id={id}',
    'GET /api/dosen.php',
    'GET /api/dosen.php?id={id}',
    'POST /api/dosen.php',
    'PUT /api/dosen.php?id={id}',
    'DELETE /api/dosen.php?id={id}',
    'GET /api/matakuliah.php',
    'GET /api/matakuliah.php?id={id}',
    'POST /api/matakuliah.php',
    'PUT /api/matakuliah.php?id={id}',
    'DELETE /api/matakuliah.php?id={id}',
    'GET /api/enrollment.php',
    'PUT /api/enrollment.php?id={id}',
    'GET /api/profile.php?nim={nim}',
    'PUT /api/profile.php?nim={nim}',
    'POST /api/password.php',
    'GET /api/laporan.php'
  ],
  'note' => 'Use Content-Type: application/json for POST/PUT bodies.',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
