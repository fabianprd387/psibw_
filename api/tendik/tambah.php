<?php
function add_tendik(): void {
  global $conn;
  $data = get_input();
  $nip = trim($data['nip'] ?? '');
  $nama = trim($data['nama'] ?? '');
  $jabatan = trim($data['jabatan'] ?? '');

  if ($nip === '' || $nama === '') {
    send_json(['error' => 'NIP dan Nama wajib diisi.'], 400);
  }

  $exists = query_fetch_one("SELECT id FROM tendik WHERE nip = '" . escape($nip) . "'");
  if ($exists) {
    send_json(['error' => 'NIP sudah terdaftar.'], 409);
  }

  $generatedPassword = ensure_user($nip, 'tendik');

  $sql = sprintf(
    "INSERT INTO tendik (nip, nama, jabatan) VALUES ('%s', '%s', '%s')",
    escape($nip),
    escape($nama),
    escape($jabatan)
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $lastId = mysqli_insert_id($conn);
  $staff = query_fetch_one("SELECT id, nip, nama, jabatan FROM tendik WHERE id = $lastId");
  send_json(['success' => true, 'generated_password' => $generatedPassword, 'tendik' => $staff], 201);
}
