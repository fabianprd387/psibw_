<?php
function edit_tendik(int $id): void {
  global $conn;
  $data = get_input();
  $staff = query_fetch_one("SELECT * FROM tendik WHERE id = $id");
  if (!$staff) {
    not_found('Tendik tidak ditemukan.');
  }

  $nip = trim($data['nip'] ?? $staff['nip']);
  $nama = trim($data['nama'] ?? $staff['nama']);
  $jabatan = trim($data['jabatan'] ?? $staff['jabatan']);

  if ($nip === '' || $nama === '') {
    send_json(['error' => 'NIP dan Nama wajib diisi.'], 400);
  }

  if ($nip !== $staff['nip']) {
    $exists = query_fetch_one("SELECT id FROM tendik WHERE nip = '" . escape($nip) . "'");
    if ($exists) {
      send_json(['error' => 'NIP sudah terdaftar.'], 409);
    }
    mysqli_query($conn, "UPDATE users SET username = '" . escape($nip) . "' WHERE username = '" . escape($staff['nip']) . "'");
  }

  $sql = sprintf(
    "UPDATE tendik SET nip = '%s', nama = '%s', jabatan = '%s' WHERE id = %d",
    escape($nip),
    escape($nama),
    escape($jabatan),
    $id
  );

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  $staff = query_fetch_one("SELECT id, nip, nama, jabatan FROM tendik WHERE id = $id");
  send_json(['success' => true, 'tendik' => $staff]);
}
