<?php
function edit_mahasiswa(int $id): void {
  global $conn;
  $data = get_input();
  $student = query_fetch_one("SELECT * FROM mahasiswa WHERE id = $id");
  if (!$student) {
    not_found('Mahasiswa tidak ditemukan.');
  }

  $nim = trim($data['nim'] ?? $student['nim']);
  $nama = trim($data['nama'] ?? $student['nama']);
  $jurusan = trim($data['jurusan'] ?? $student['jurusan']);
  $angkatan = trim($data['angkatan'] ?? $student['angkatan']);

  if ($nim === '' || $nama === '') {
    send_json(['error' => 'NIM dan Nama wajib diisi.'], 400);
  }

  if ($nim !== $student['nim']) {
    $already = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
    if ($already) {
      send_json(['error' => 'NIM sudah terdaftar.'], 409);
    }
    mysqli_query($conn, "UPDATE users SET username = '" . escape($nim) . "' WHERE username = '" . escape($student['nim']) . "'");
  }

  $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';
  $update = sprintf(
    "UPDATE mahasiswa SET nim = '%s', nama = '%s', jurusan = '%s', angkatan = %s WHERE id = %d",
    escape($nim),
    escape($nama),
    escape($jurusan),
    $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue),
    $id
  );

  if (!mysqli_query($conn, $update)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE id = $id");
  send_json(['success' => true, 'mahasiswa' => $student]);
}
