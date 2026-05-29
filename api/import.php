<?php
require_once __DIR__ . '/base.php';
global $conn;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  method_not_allowed(['POST']);
}

$data = get_input();
$type = trim(strtolower($data['type'] ?? ''));
$rows = $data['rows'] ?? [];

if (!in_array($type, ['mahasiswa', 'dosen', 'matakuliah', 'enrollment', 'nilai'], true)) {
  send_json(['error' => 'Tipe import tidak valid. Pilih salah satu: mahasiswa, dosen, matakuliah, enrollment, nilai.'], 400);
}

if (!is_array($rows) || count($rows) === 0) {
  send_json(['error' => 'Data import kosong atau format file tidak dikenali.'], 400);
}

function normalize_row(array $row): array {
  $normalized = [];
  foreach ($row as $key => $value) {
    $normalized[strtolower(trim((string) $key))] = trim((string) $value);
  }
  return $normalized;
}

function ensure_user(string $username, string $role): void {
  global $conn;
  $username = escape($username);
  $userExists = query_fetch_one("SELECT id FROM users WHERE username = '$username'");
  if (!$userExists) {
    $hash = password_hash('password', PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('$username', '$hash', '$role')");
  }
}

function insert_mahasiswa(array $row): array {
  global $conn;
  $nim = $row['nim'] ?? '';
  $nama = $row['nama'] ?? '';
  $jurusan = $row['jurusan'] ?? '';
  $angkatan = $row['angkatan'] ?? '';

  if ($nim === '' || $nama === '') {
    return ['error' => 'Field nim dan nama wajib diisi.'];
  }

  $exists = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
  if ($exists) {
    return ['skip' => true, 'message' => 'Mahasiswa dengan NIM sudah ada.'];
  }

  ensure_user($nim, 'mahasiswa');
  $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';
  $query = sprintf(
    "INSERT INTO mahasiswa (nim, nama, jurusan, angkatan) VALUES ('%s', '%s', '%s', %s)",
    escape($nim),
    escape($nama),
    escape($jurusan),
    $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue)
  );

  if (!mysqli_query($conn, $query)) {
    return ['error' => mysqli_error($conn)];
  }
  return ['inserted' => true];
}

function insert_dosen(array $row): array {
  global $conn;
  $nip = $row['nip'] ?? '';
  $nama = $row['nama'] ?? '';
  $jurusan = $row['jurusan'] ?? '';

  if ($nip === '' || $nama === '') {
    return ['error' => 'Field nip dan nama wajib diisi.'];
  }

  $exists = query_fetch_one("SELECT id FROM dosen WHERE nip = '" . escape($nip) . "'");
  if ($exists) {
    return ['skip' => true, 'message' => 'Dosen dengan NIP sudah ada.'];
  }

  ensure_user($nip, 'dosen');
  $sql = sprintf(
    "INSERT INTO dosen (nip, nama, jurusan) VALUES ('%s', '%s', '%s')",
    escape($nip),
    escape($nama),
    escape($jurusan)
  );

  if (!mysqli_query($conn, $sql)) {
    return ['error' => mysqli_error($conn)];
  }
  return ['inserted' => true];
}

function insert_matakuliah(array $row): array {
  global $conn;
  $kode = $row['kode_mk'] ?? $row['kode'] ?? '';
  $nama = $row['nama_mk'] ?? $row['nama'] ?? '';
  $sks = $row['sks'] ?? '';
  $semester = $row['semester'] ?? '';
  $dosenId = $row['dosen_id'] ?? '';
  $dosenNip = $row['dosen_nip'] ?? '';

  if ($kode === '' || $nama === '' || $sks === '') {
    return ['error' => 'Field kode_mk, nama_mk, dan sks wajib diisi.'];
  }

  $exists = query_fetch_one("SELECT id FROM mata_kuliah WHERE kode_mk = '" . escape($kode) . "'");
  if ($exists) {
    return ['skip' => true, 'message' => 'Mata kuliah dengan kode sudah ada.'];
  }

  if ($dosenNip !== '') {
    $teacher = query_fetch_one("SELECT id FROM dosen WHERE nip = '" . escape($dosenNip) . "'");
    if (!$teacher) {
      return ['error' => 'Dosen dengan NIP ' . $dosenNip . ' tidak ditemukan.'];
    }
    $dosenId = $teacher['id'];
  }

  $dosenIdValue = ($dosenId !== '' && $dosenId !== null) ? (int) $dosenId : 'NULL';
  if ($dosenIdValue !== 'NULL') {
    $teacherExists = query_fetch_one("SELECT id FROM dosen WHERE id = $dosenIdValue");
    if (!$teacherExists) {
      return ['error' => 'Dosen dengan ID tidak ditemukan.'];
    }
  }

  $semesterValue = ($semester !== '') ? (int)$semester : 'NULL';

  $sql = sprintf(
    "INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, dosen_id) VALUES ('%s', '%s', %d, %s, %s)",
    escape($kode),
    escape($nama),
    (int) $sks,
    $semesterValue,
    $dosenIdValue === 'NULL' ? 'NULL' : $dosenIdValue
  );

  if (!mysqli_query($conn, $sql)) {
    return ['error' => mysqli_error($conn)];
  }
  return ['inserted' => true];
}
function insert_enrollment(array $row): array {
  global $conn;
  $nim = $row['nim'] ?? '';
  $mkCode = $row['kode_mk'] ?? $row['kode'] ?? '';
  $mkId = $row['matakuliah_id'] ?? '';

  if ($nim === '') {
    return ['error' => 'Field nim wajib diisi.'];
  }
  if ($mkCode === '' && $mkId === '') {
    return ['error' => 'Field kode_mk atau matakuliah_id wajib diisi.'];
  }

  $mahasiswa = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
  if (!$mahasiswa) {
    return ['error' => 'Mahasiswa dengan NIM ' . $nim . ' tidak ditemukan.'];
  }

  if ($mkCode !== '') {
    $matakuliah = query_fetch_one("SELECT id FROM mata_kuliah WHERE kode_mk = '" . escape($mkCode) . "'");
    if (!$matakuliah) {
      return ['error' => 'Mata kuliah dengan kode ' . $mkCode . ' tidak ditemukan.'];
    }
    $mkId = $matakuliah['id'];
  } else {
    $matakuliah = query_fetch_one("SELECT id FROM mata_kuliah WHERE id = " . (int) $mkId);
    if (!$matakuliah) {
      return ['error' => 'Mata kuliah dengan ID ' . $mkId . ' tidak ditemukan.'];
    }
  }

  $exists = query_fetch_one(
    "SELECT id FROM enrollment WHERE mahasiswa_id = " . $mahasiswa['id'] . " AND matakuliah_id = " . (int) $mkId
  );
  if ($exists) {
    return ['skip' => true, 'message' => 'Enrollment untuk mahasiswa dan mata kuliah sudah ada.'];
  }

  $sql = sprintf(
    "INSERT INTO enrollment (mahasiswa_id, matakuliah_id) VALUES (%d, %d)",
    $mahasiswa['id'],
    (int) $mkId
  );

  if (!mysqli_query($conn, $sql)) {
    return ['error' => mysqli_error($conn)];
  }
  return ['inserted' => true];
}

function insert_nilai(array $row): array {
  global $conn;
  $nim = $row['nim'] ?? '';
  $mkCode = $row['kode_mk'] ?? $row['kode'] ?? '';
  $mkId = $row['matakuliah_id'] ?? '';
  $nilai = $row['nilai'] ?? '';

  if ($nim === '') {
    return ['error' => 'Field nim wajib diisi.'];
  }
  if (($mkCode === '' && $mkId === '') || $nilai === '') {
    return ['error' => 'Field kode_mk/matakuliah_id dan nilai wajib diisi.'];
  }

  $mahasiswa = query_fetch_one("SELECT id FROM mahasiswa WHERE nim = '" . escape($nim) . "'");
  if (!$mahasiswa) {
    return ['error' => 'Mahasiswa dengan NIM ' . $nim . ' tidak ditemukan.'];
  }

  if ($mkCode !== '') {
    $matakuliah = query_fetch_one("SELECT id FROM mata_kuliah WHERE kode_mk = '" . escape($mkCode) . "'");
    if (!$matakuliah) {
      return ['error' => 'Mata kuliah dengan kode ' . $mkCode . ' tidak ditemukan.'];
    }
    $mkId = $matakuliah['id'];
  } else {
    $matakuliah = query_fetch_one("SELECT id FROM mata_kuliah WHERE id = " . (int) $mkId);
    if (!$matakuliah) {
      return ['error' => 'Mata kuliah dengan ID ' . $mkId . ' tidak ditemukan.'];
    }
  }

  $enrollment = query_fetch_one(
    "SELECT id FROM enrollment WHERE mahasiswa_id = " . $mahasiswa['id'] . " AND matakuliah_id = " . (int) $mkId
  );
  if (!$enrollment) {
    return ['error' => 'Enrollment tidak ditemukan untuk mahasiswa dan mata kuliah ini.'];
  }

  $nilai = (int) $nilai;
  $sql = sprintf(
    "UPDATE enrollment SET nilai = %d WHERE id = %d",
    $nilai,
    $enrollment['id']
  );

  if (!mysqli_query($conn, $sql)) {
    return ['error' => mysqli_error($conn)];
  }
  return ['inserted' => true];
}


$result = [
  'inserted' => 0,
  'skipped' => 0,
  'errors' => []
];

foreach ($rows as $index => $rawRow) {
  $rowNumber = $index + 2;
  if (!is_array($rawRow)) {
    $result['errors'][] = ['row' => $rowNumber, 'message' => 'Baris bukan objek data yang valid.'];
    continue;
  }

  $row = normalize_row($rawRow);
  if ($type === 'mahasiswa') {
    $insertResult = insert_mahasiswa($row);
  } elseif ($type === 'dosen') {
    $insertResult = insert_dosen($row);
  } elseif ($type === 'matakuliah') {
    $insertResult = insert_matakuliah($row);
  } elseif ($type === 'enrollment') {
    $insertResult = insert_enrollment($row);
  } else {
    $insertResult = insert_nilai($row);
  }

  if (isset($insertResult['inserted'])) {
    $result['inserted']++;
    continue;
  }
  if (isset($insertResult['skip'])) {
    $result['skipped']++;
    continue;
  }
  $result['errors'][] = ['row' => $rowNumber, 'message' => $insertResult['error'] ?? 'Kesalahan tidak diketahui.'];
}

$message = sprintf(
  'Import selesai. Ditambahkan: %d, Dilewati: %d, Error: %d.',
  $result['inserted'],
  $result['skipped'],
  count($result['errors'])
);

send_json(['success' => true, 'message' => $message, 'result' => $result]);
