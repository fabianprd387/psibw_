<?php
require_once __DIR__ . '/base.php';
global $conn;

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$nip = isset($_GET['nip']) ? trim($_GET['nip']) : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($id) {
    $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE id = $id");
    if (!$teacher) {
      not_found('Dosen tidak ditemukan.');
    }
    send_json($teacher);
  }
  if ($nip) {
    $nip = escape($nip);
    $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE nip = '$nip'");
    if (!$teacher) {
      not_found('Dosen tidak ditemukan.');
    }
    send_json($teacher);
  }
  $teachers = query_fetch_all('SELECT id, nip, nama, jurusan FROM dosen ORDER BY id DESC');
  send_json($teachers);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = get_input();
  $nip = trim($data['nip'] ?? '');
  $nama = trim($data['nama'] ?? '');
  $jurusan = trim($data['jurusan'] ?? '');

  if ($nip === '' || $nama === '') {
    send_json(['error' => 'NIP dan Nama wajib diisi.'], 400);
  }

  $exists = query_fetch_one("SELECT id FROM dosen WHERE nip = '" . escape($nip) . "'");
  if ($exists) {
    send_json(['error' => 'NIP sudah terdaftar.'], 409);
  }

  $userExists = query_fetch_one("SELECT id FROM users WHERE username = '" . escape($nip) . "'");
  if (!$userExists) {
    $hash = password_hash('password', PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('" . escape($nip) . "', '$hash', 'dosen')");
  }

  $sql = sprintf(
    "INSERT INTO dosen (nip, nama, jurusan) VALUES ('%s', '%s', '%s')",
    escape($nip),
    escape($nama),
    escape($jurusan)
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $lastId = mysqli_insert_id($conn);
  $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE id = $lastId");
  send_json(['success' => true, 'dosen' => $teacher], 201);
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $teacher = query_fetch_one("SELECT * FROM dosen WHERE id = $id");
  if (!$teacher) {
    not_found('Dosen tidak ditemukan.');
  }

  $nip = trim($data['nip'] ?? $teacher['nip']);
  $nama = trim($data['nama'] ?? $teacher['nama']);
  $jurusan = trim($data['jurusan'] ?? $teacher['jurusan']);

  if ($nip === '' || $nama === '') {
    send_json(['error' => 'NIP dan Nama wajib diisi.'], 400);
  }

  if ($nip !== $teacher['nip']) {
    $exists = query_fetch_one("SELECT id FROM dosen WHERE nip = '" . escape($nip) . "'");
    if ($exists) {
      send_json(['error' => 'NIP sudah terdaftar.'], 409);
    }
    mysqli_query($conn, "UPDATE users SET username = '" . escape($nip) . "' WHERE username = '" . escape($teacher['nip']) . "'");
  }

  $sql = sprintf(
    "UPDATE dosen SET nip = '%s', nama = '%s', jurusan = '%s' WHERE id = %d",
    escape($nip),
    escape($nama),
    escape($jurusan),
    $id
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE id = $id");
  send_json(['success' => true, 'dosen' => $teacher]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $teacher = query_fetch_one("SELECT * FROM dosen WHERE id = $id");
  if (!$teacher) {
    not_found('Dosen tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM dosen WHERE id = $id");
  mysqli_query($conn, "DELETE FROM users WHERE username = '" . escape($teacher['nip']) . "'");
  send_json(['success' => true]);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
