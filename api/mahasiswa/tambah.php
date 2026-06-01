<?php
function add_mahasiswa(): void {
  global $conn;
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

  $generatedPassword = ensure_user($nim, 'mahasiswa');

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
  send_json(['success' => true, 'generated_password' => $generatedPassword, 'mahasiswa' => $student], 201);
}
