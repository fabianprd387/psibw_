<?php
function edit_dosen(int $id): void {
  global $conn;
  $data = get_input();
  $teacher = query_fetch_one("SELECT * FROM dosen WHERE id = $id");
  if (!$teacher) {
    not_found('Dosen tidak ditemukan.');
  }

  $nip = trim($data['nip'] ?? $teacher['nip']);
  $nama = trim($data['nama'] ?? $teacher['nama']);
  $jurusan = trim($data['jurusan'] ?? $teacher['jurusan']);

  if ($nip === '' || $nama === '') {
    send_json(['error' => 'NIP dan Nama wajib diisi.'], 400);
  }

  if ($nip !== $teacher['nip']) {
    $exists = query_fetch_one("SELECT id FROM dosen WHERE nip = '" . escape($nip) . "'");
    if ($exists) {
      send_json(['error' => 'NIP sudah terdaftar.'], 409);
    }
    mysqli_query($conn, "UPDATE users SET username = '" . escape($nip) . "' WHERE username = '" . escape($teacher['nip']) . "'");
  }

  $sql = sprintf(
    "UPDATE dosen SET nip = '%s', nama = '%s', jurusan = '%s' WHERE id = %d",
    escape($nip),
    escape($nama),
    escape($jurusan),
    $id
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE id = $id");
  send_json(['success' => true, 'dosen' => $teacher]);
}
