<?php
require_once __DIR__ . '/../base.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/tambah.php';
require_once __DIR__ . '/edit.php';
require_once __DIR__ . '/delete.php';

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
  add_mahasiswa();
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  edit_mahasiswa($id);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  delete_mahasiswa($id);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
