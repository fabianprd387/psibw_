<?php
require_once __DIR__ . '/base.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  method_not_allowed(['GET']);
}

$totalMahasiswa = query_fetch_one('SELECT COUNT(*) AS total FROM mahasiswa');
$totalDosen = query_fetch_one('SELECT COUNT(*) AS total FROM dosen');
$totalMatakuliah = query_fetch_one('SELECT COUNT(*) AS total FROM mata_kuliah');
$totalNilai = query_fetch_one('SELECT COUNT(*) AS total FROM nilai');

send_json([
  'total_mahasiswa' => (int) ($totalMahasiswa['total'] ?? 0),
  'total_dosen' => (int) ($totalDosen['total'] ?? 0),
  'total_matakuliah' => (int) ($totalMatakuliah['total'] ?? 0),
  'total_nilai' => (int) ($totalNilai['total'] ?? 0),
]);
