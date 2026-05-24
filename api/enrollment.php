<?php
require_once __DIR__ . '/base.php';
global $conn;

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$nim = isset($_GET['nim']) ? trim($_GET['nim']) : null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($id) {
    $record = query_fetch_one("SELECT n.id, n.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, n.nilai FROM nilai n JOIN mahasiswa m ON n.nim = m.nim JOIN mata_kuliah mk ON n.id_matkul = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE n.id = $id");
    if (!$record) {
      not_found('Nilai tidak ditemukan.');
    }
    send_json($record);
  }
  if ($nim) {
    $nim = escape($nim);
    $records = query_fetch_all("SELECT n.id, n.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, n.nilai FROM nilai n JOIN mahasiswa m ON n.nim = m.nim JOIN mata_kuliah mk ON n.id_matkul = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE n.nim = '$nim' ORDER BY n.id DESC");
    send_json($records);
  }
  $records = query_fetch_all('SELECT n.id, n.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, n.nilai FROM nilai n JOIN mahasiswa m ON n.nim = m.nim JOIN mata_kuliah mk ON n.id_matkul = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id ORDER BY n.id DESC');
  send_json($records);
}

if ($id === null) {
  method_not_allowed(['GET']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $record = query_fetch_one("SELECT * FROM nilai WHERE id = $id");
  if (!$record) {
    not_found('Nilai tidak ditemukan.');
  }

  $nilai = trim($data['nilai'] ?? '');
  if ($nilai === '') {
    send_json(['error' => 'Nilai wajib diisi.'], 400);
  }

  $sql = sprintf("UPDATE nilai SET nilai = '%s' WHERE id = %d", escape($nilai), $id);
  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $record = query_fetch_one("SELECT n.id, n.nim, m.nama AS mahasiswa, mk.nama_mk, d.nama AS dosen, n.nilai FROM nilai n JOIN mahasiswa m ON n.nim = m.nim JOIN mata_kuliah mk ON n.id_matkul = mk.id LEFT JOIN dosen d ON mk.dosen_id = d.id WHERE n.id = $id");
  send_json(['success' => true, 'nilai' => $record]);
}

method_not_allowed(['GET', 'PUT']);
