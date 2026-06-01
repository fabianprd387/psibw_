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
    $staff = query_fetch_one("SELECT id, nip, nama, jabatan FROM tendik WHERE id = $id");
    if (!$staff) {
      not_found('Tendik tidak ditemukan.');
    }
    send_json($staff);
  }
  if ($nip) {
    $nip = escape($nip);
    $staff = query_fetch_one("SELECT id, nip, nama, jabatan FROM tendik WHERE nip = '$nip'");
    if (!$staff) {
      not_found('Tendik tidak ditemukan.');
    }
    send_json($staff);
  }
  $staffList = query_fetch_all('SELECT id, nip, nama, jabatan FROM tendik ORDER BY id DESC');
  send_json($staffList);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  add_tendik();
}

if ($id === null) {
  method_not_allowed(['GET', 'POST']);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  edit_tendik($id);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  delete_tendik($id);
}

method_not_allowed(['GET', 'PUT', 'DELETE']);
