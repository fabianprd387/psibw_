<?php
require_once __DIR__ . '/../base.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/tambah.php';
require_once __DIR__ . '/edit.php';
require_once __DIR__ . '/delete.php';

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
  add_dosen();
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  edit_dosen($id);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  delete_dosen($id);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
