<?php
function add_dosen(): void {
  global $conn;
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

  ensure_user($nip, 'dosen');

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
