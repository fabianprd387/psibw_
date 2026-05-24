<?php
require_once __DIR__ . '/base.php';
global $conn;

$nim = isset($_GET['nim']) ? trim($_GET['nim']) : null;
if (!$nim) {
  send_json(['error' => 'Parameter nim diperlukan.'], 400);
}

$nimEscaped = escape($nim);
$student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE nim = '$nimEscaped'");
if (!$student) {
  not_found('Mahasiswa tidak ditemukan.');
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  send_json($student);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $nama = trim($data['nama'] ?? $student['nama']);
  $jurusan = trim($data['jurusan'] ?? $student['jurusan']);
  $angkatan = trim($data['angkatan'] ?? $student['angkatan']);

  if ($nama === '') {
    send_json(['error' => 'Nama wajib diisi.'], 400);
  }

  $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';
  $sql = sprintf(
    "UPDATE mahasiswa SET nama = '%s', jurusan = '%s', angkatan = %s WHERE nim = '%s'",
    escape($nama),
    escape($jurusan),
    $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue),
    $nimEscaped
  );
  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE nim = '$nimEscaped'");
  send_json(['success' => true, 'profile' => $student]);
}

method_not_allowed(['GET', 'PUT']);
