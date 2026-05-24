<?php
require_once __DIR__ . '/base.php';
global $conn;

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$kode = isset($_GET['kode_mk']) ? trim($_GET['kode_mk']) : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($id) {
    $course = query_fetch_one("SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.dosen_id, d.nama AS dosen FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id WHERE m.id = $id");
    if (!$course) {
      not_found('Matakuliah tidak ditemukan.');
    }
    send_json($course);
  }
  if ($kode) {
    $kode = escape($kode);
    $course = query_fetch_one("SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.dosen_id, d.nama AS dosen FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id WHERE m.kode_mk = '$kode'");
    if (!$course) {
      not_found('Matakuliah tidak ditemukan.');
    }
    send_json($course);
  }
  $courses = query_fetch_all('SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.dosen_id, d.nama AS dosen FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id ORDER BY m.id DESC');
  send_json($courses);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = get_input();
  $kode = trim($data['kode_mk'] ?? '');
  $nama = trim($data['nama_mk'] ?? '');
  $sks = trim($data['sks'] ?? '');
  $dosenId = isset($data['dosen_id']) ? (int) $data['dosen_id'] : null;

  if ($kode === '' || $nama === '' || $sks === '') {
    send_json(['error' => 'Kode MK, Nama MK, dan SKS wajib diisi.'], 400);
  }

  $exists = query_fetch_one("SELECT id FROM mata_kuliah WHERE kode_mk = '" . escape($kode) . "'");
  if ($exists) {
    send_json(['error' => 'Kode matakuliah sudah terdaftar.'], 409);
  }

  if ($dosenId) {
    $dosenExists = query_fetch_one("SELECT id FROM dosen WHERE id = $dosenId");
    if (!$dosenExists) {
      send_json(['error' => 'Dosen tidak ditemukan.'], 404);
    }
  }

  $sql = sprintf(
    "INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, dosen_id) VALUES ('%s', '%s', %d, %s)",
    escape($kode),
    escape($nama),
    (int) $sks,
    $dosenId ? (int)$dosenId : 'NULL'
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $lastId = mysqli_insert_id($conn);
  $course = query_fetch_one("SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.dosen_id, d.nama AS dosen FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id WHERE m.id = $lastId");
  send_json(['success' => true, 'matakuliah' => $course], 201);
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $course = query_fetch_one("SELECT * FROM mata_kuliah WHERE id = $id");
  if (!$course) {
    not_found('Matakuliah tidak ditemukan.');
  }

  $kode = trim($data['kode_mk'] ?? $course['kode_mk']);
  $nama = trim($data['nama_mk'] ?? $course['nama_mk']);
  $sks = trim($data['sks'] ?? $course['sks']);
  $dosenId = isset($data['dosen_id']) ? (int) $data['dosen_id'] : $course['dosen_id'];

  if ($kode === '' || $nama === '' || $sks === '') {
    send_json(['error' => 'Kode MK, Nama MK, dan SKS wajib diisi.'], 400);
  }

  if ($kode !== $course['kode_mk']) {
    $exists = query_fetch_one("SELECT id FROM mata_kuliah WHERE kode_mk = '" . escape($kode) . "'");
    if ($exists) {
      send_json(['error' => 'Kode matakuliah sudah terdaftar.'], 409);
    }
  }

  if ($dosenId) {
    $dosenExists = query_fetch_one("SELECT id FROM dosen WHERE id = $dosenId");
    if (!$dosenExists) {
      send_json(['error' => 'Dosen tidak ditemukan.'], 404);
    }
  }

  $sql = sprintf(
    "UPDATE mata_kuliah SET kode_mk = '%s', nama_mk = '%s', sks = %d, dosen_id = %s WHERE id = %d",
    escape($kode),
    escape($nama),
    (int) $sks,
    $dosenId ? (int)$dosenId : 'NULL',
    $id
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $course = query_fetch_one("SELECT m.id, m.kode_mk, m.nama_mk, m.sks, m.dosen_id, d.nama AS dosen FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id WHERE m.id = $id");
  send_json(['success' => true, 'matakuliah' => $course]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $course = query_fetch_one("SELECT * FROM mata_kuliah WHERE id = $id");
  if (!$course) {
    not_found('Matakuliah tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM mata_kuliah WHERE id = $id");
  send_json(['success' => true]);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
