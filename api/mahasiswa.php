<?php
require_once __DIR__ . '/base.php';
global $conn;

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$nim = isset($_GET['nim']) ? trim($_GET['nim']) : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($id) {
    $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE id = $id");
    if (!$student) {
      not_found('Mahasiswa tidak ditemukan.');
    }
    send_json($student);
  }
  if ($nim) {
    $nim = escape($nim);
    $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE nim = '$nim'");
    if (!$student) {
      not_found('Mahasiswa tidak ditemukan.');
    }
    send_json($student);
  }
  $students = query_fetch_all('SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa ORDER BY id DESC');
  send_json($students);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = get_input();
  $nim = trim($data['nim'] ?? '');
  $nama = trim($data['nama'] ?? '');
  $jurusan = trim($data['jurusan'] ?? '');
  $angkatan = trim($data['angkatan'] ?? '');

  if ($nim === '' || $nama === '') {
    send_json(['error' => 'NIM dan Nama wajib diisi.'], 400);
  }

  $exists = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
  if ($exists) {
    send_json(['error' => 'NIM sudah terdaftar.'], 409);
  }

  $userExists = query_fetch_one("SELECT id FROM users WHERE username = '" . escape($nim) . "'");
  if (!$userExists) {
    $hash = password_hash('password', PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('" . escape($nim) . "', '$hash', 'mahasiswa')");
  }

  $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';
  $query = sprintf(
    "INSERT INTO mahasiswa (nim, nama, jurusan, angkatan) VALUES ('%s', '%s', '%s', %s)",
    escape($nim),
    escape($nama),
    escape($jurusan),
    $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue)
  );

  if (!mysqli_query($conn, $query)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $lastId = mysqli_insert_id($conn);
  $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE id = $lastId");
  send_json(['success' => true, 'mahasiswa' => $student], 201);
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $student = query_fetch_one("SELECT * FROM mahasiswa WHERE id = $id");
  if (!$student) {
    not_found('Mahasiswa tidak ditemukan.');
  }

  $nim = trim($data['nim'] ?? $student['nim']);
  $nama = trim($data['nama'] ?? $student['nama']);
  $jurusan = trim($data['jurusan'] ?? $student['jurusan']);
  $angkatan = trim($data['angkatan'] ?? $student['angkatan']);

  if ($nim === '' || $nama === '') {
    send_json(['error' => 'NIM dan Nama wajib diisi.'], 400);
  }

  if ($nim !== $student['nim']) {
    $already = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
    if ($already) {
      send_json(['error' => 'NIM sudah terdaftar.'], 409);
    }
    mysqli_query($conn, "UPDATE users SET username = '" . escape($nim) . "' WHERE username = '" . escape($student['nim']) . "'");
  }

  $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';
  $update = sprintf(
    "UPDATE mahasiswa SET nim = '%s', nama = '%s', jurusan = '%s', angkatan = %s WHERE id = %d",
    escape($nim),
    escape($nama),
    escape($jurusan),
    $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue),
    $id
  );

  if (!mysqli_query($conn, $update)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE id = $id");
  send_json(['success' => true, 'mahasiswa' => $student]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $student = query_fetch_one("SELECT * FROM mahasiswa WHERE id = $id");
  if (!$student) {
    not_found('Mahasiswa tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM mahasiswa WHERE id = $id");
  mysqli_query($conn, "DELETE FROM users WHERE username = '" . escape($student['nim']) . "'");
  send_json(['success' => true]);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
