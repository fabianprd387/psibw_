<?php
require_once __DIR__ . '/base.php';
global $conn;

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$nim = isset($_GET['nim']) ? trim($_GET['nim']) : null;
$dosenId = isset($_GET['dosen_id']) ? (int) $_GET['dosen_id'] : null;

// Get current user info
$currentUser = get_current_user();
/** @var array{id: int, username: string, role: string}|null $currentUser */
$myDosenId = null;
if ($currentUser && $currentUser['role'] === 'dosen') {
  $myDosenId = get_dosen_id_from_username($currentUser['username']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($id) {
    $record = query_fetch_one("SELECT e.id, m.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, e.nilai, mk.dosen_id FROM enrollment e JOIN mahasiswa m ON e.mahasiswa_id = m.id JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE e.id = $id");
    if (!$record) {
      not_found('Enrollment tidak ditemukan.');
    }
    
    // Jika user adalah dosen, hanya bisa lihat enrollment untuk matkul miliknya
    if ($myDosenId && (int)$record['dosen_id'] !== $myDosenId) {
      not_found('Enrollment tidak ditemukan.');
    }
    
    send_json($record);
  }

  $conditions = [];
  if ($nim) {
    $nim = escape($nim);
    $conditions[] = "m.nim = '$nim'";
  }
  if ($dosenId) {
    $conditions[] = "mk.dosen_id = $dosenId";
  }
  
  // Jika user adalah dosen, filter hanya untuk matkul miliknya
  if ($myDosenId) {
    $conditions[] = "mk.dosen_id = $myDosenId";
  }
  
  $where = count($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

  $records = query_fetch_all("SELECT e.id, m.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, e.nilai, mk.dosen_id FROM enrollment e JOIN mahasiswa m ON e.mahasiswa_id = m.id JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id $where ORDER BY e.id DESC");
  send_json($records);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = get_input();
  $nimValue = trim($data['nim'] ?? '');
  $mataKuliahId = isset($data['id_matkul']) ? (int) $data['id_matkul'] : null;
  $nilai = trim($data['nilai'] ?? '');

  if ($nimValue === '' || !$mataKuliahId) {
    send_json(['error' => 'NIM dan ID mata kuliah wajib diisi.'], 400);
  }

  $student = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nimValue) . "'");
  if (!$student) {
    not_found('Mahasiswa tidak ditemukan.');
  }

  $course = query_fetch_one("SELECT id, dosen_id FROM mata_kuliah WHERE id = $mataKuliahId");
  if (!$course) {
    not_found('Mata kuliah tidak ditemukan.');
  }
  
  // Jika user adalah dosen, hanya bisa membuat enrollment untuk matkul miliknya
  if ($myDosenId && (int)$course['dosen_id'] !== $myDosenId) {
    not_found('Mata kuliah tidak ditemukan.');
  }

  $exists = query_fetch_one("SELECT id FROM enrollment WHERE mahasiswa_id = {$student['id']} AND mata_kuliah_id = $mataKuliahId");
  if ($exists) {
    send_json(['error' => 'Enrollment untuk mahasiswa dan mata kuliah ini sudah ada.'], 409);
  }

  $sql = sprintf(
    "INSERT INTO enrollment (mahasiswa_id, mata_kuliah_id, nilai) VALUES (%d, %d, %s)",
    $student['id'],
    $mataKuliahId,
    $nilai !== '' ? "'" . escape($nilai) . "'" : 'NULL'
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $lastId = mysqli_insert_id($conn);
  $record = query_fetch_one("SELECT e.id, m.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, e.nilai, mk.dosen_id FROM enrollment e JOIN mahasiswa m ON e.mahasiswa_id = m.id JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE e.id = $lastId");
  send_json(['success' => true, 'enrollment' => $record], 201);
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $record = query_fetch_one("SELECT e.*, mk.dosen_id FROM enrollment e JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id WHERE e.id = $id");
  if (!$record) {
    not_found('Enrollment tidak ditemukan.');
  }
  
  // Jika user adalah dosen, hanya bisa ubah enrollment untuk matkul miliknya
  if ($myDosenId && (int)$record['dosen_id'] !== $myDosenId) {
    not_found('Enrollment tidak ditemukan.');
  }

  $nilai = trim($data['nilai'] ?? '');
  if ($nilai === '') {
    send_json(['error' => 'Nilai wajib diisi.'], 400);
  }

  $sql = sprintf("UPDATE enrollment SET nilai = '%s' WHERE id = %d", escape($nilai), $id);
  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $record = query_fetch_one("SELECT e.id, m.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, e.nilai, mk.dosen_id FROM enrollment e JOIN mahasiswa m ON e.mahasiswa_id = m.id JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE e.id = $id");
  send_json(['success' => true, 'enrollment' => $record]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $record = query_fetch_one("SELECT e.*, mk.dosen_id FROM enrollment e JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id WHERE e.id = $id");
  if (!$record) {
    not_found('Enrollment tidak ditemukan.');
  }
  
  // Jika user adalah dosen, hanya bisa hapus enrollment untuk matkul miliknya
  if ($myDosenId && (int)$record['dosen_id'] !== $myDosenId) {
    not_found('Enrollment tidak ditemukan.');
  }

  if (!mysqli_query($conn, "DELETE FROM enrollment WHERE id = $id")) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  send_json(['success' => true]);
}

method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
