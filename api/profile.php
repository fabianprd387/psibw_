<?php
require_once __DIR__ . '/base.php';
global $conn;

$nim = isset($_GET['nim']) ? trim($_GET['nim']) : null;
if (!$nim) {
  send_json(['error' => 'Parameter nim diperlukan.'], 400);
}

$username = escape($nim);

function profile_photo_column_exists(): bool {
  global $conn;
  $result = mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'profile_photo'");
  return $result && mysqli_num_rows($result) > 0;
}

$photoColumn = profile_photo_column_exists() ? ', profile_photo' : ', NULL AS profile_photo';
$user = query_fetch_one("SELECT id, username, role{$photoColumn} FROM users WHERE username = '$username' LIMIT 1");
if (!$user) {
  not_found('Pengguna tidak ditemukan.');
}

function build_profile(array $user): array {
  $profile = [
    'username' => $user['username'],
    'role' => $user['role'],
    'photo_url' => $user['profile_photo'] ? $user['profile_photo'] : null,
  ];

  if ($user['role'] === 'mahasiswa') {
    $student = query_fetch_one("SELECT id, nim, nama, jurusan, angkatan FROM mahasiswa WHERE nim = '" . escape($user['username']) . "'");
    if (!$student) return [];
    $profile['name'] = $student['nama'];
    $profile['jurusan'] = $student['jurusan'];
    $profile['angkatan'] = $student['angkatan'];
    $profile['label_id'] = 'NIM';
    $profile['id_value'] = $student['nim'];
  } elseif ($user['role'] === 'dosen') {
    $teacher = query_fetch_one("SELECT id, nip, nama, jurusan FROM dosen WHERE nip = '" . escape($user['username']) . "'");
    if (!$teacher) return [];
    $profile['name'] = $teacher['nama'];
    $profile['jurusan'] = $teacher['jurusan'];
    $profile['label_id'] = 'NIP';
    $profile['id_value'] = $teacher['nip'];
  } else {
    $staff = query_fetch_one("SELECT id, nip, nama, jabatan FROM tendik WHERE nip = '" . escape($user['username']) . "'");
    if (!$staff) return [];
    $profile['name'] = $staff['nama'];
    $profile['jabatan'] = $staff['jabatan'];
    $profile['label_id'] = 'NIP';
    $profile['id_value'] = $staff['nip'];
  }

  return $profile;
}

function save_profile_photo(string $username, string $photoData): ?string {
  if (!preg_match('/^data:(image\/png|image\/jpeg|image\/jpg);base64,(.+)$/i', $photoData, $matches)) {
    return null;
  }

  $mimeType = strtolower($matches[1]);
  $data = base64_decode($matches[2]);
  if ($data === false) {
    return null;
  }

  $extensions = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/jpg' => 'jpg',
  ];

  $extension = $extensions[$mimeType] ?? null;
  if (!$extension) {
    return null;
  }

  $uploadsDir = realpath(__DIR__ . '/../public/uploads');
  if ($uploadsDir === false) {
    $uploadsDir = __DIR__ . '/../public/uploads';
  }
  if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0755, true)) {
    return null;
  }

  $safeUsername = preg_replace('/[^a-zA-Z0-9_-]/', '_', $username);
  $filename = sprintf('%s_profile_%s.%s', $safeUsername, time(), $extension);
  $filePath = $uploadsDir . '/' . $filename;

  if (file_put_contents($filePath, $data) === false) {
    return null;
  }

  return 'uploads/' . $filename;
}

$profile = build_profile($user);
if (!$profile) {
  not_found('Profil tidak ditemukan.');
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  send_json($profile);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  $data = get_input();
  $name = trim($data['name'] ?? $profile['name']);
  $updateUserPhoto = false;
  $photoPath = null;

  if ($name === '') {
    send_json(['error' => 'Nama wajib diisi.'], 400);
  }

  if (!empty($data['photo_data']) && is_string($data['photo_data'])) {
    $photoPath = save_profile_photo($user['username'], $data['photo_data']);
    if ($photoPath === null) {
      send_json(['error' => 'Format foto tidak valid. Gunakan PNG atau JPEG.'], 400);
    }
    $updateUserPhoto = true;
  }

  if ($user['role'] === 'mahasiswa') {
    $jurusan = trim($data['jurusan'] ?? $profile['jurusan']);
    $angkatan = trim($data['angkatan'] ?? $profile['angkatan']);
    $angkatanValue = $angkatan !== '' ? (int) $angkatan : 'NULL';

    $sql = sprintf(
      "UPDATE mahasiswa SET nama = '%s', jurusan = '%s', angkatan = %s WHERE nim = '%s'",
      escape($name),
      escape($jurusan),
      $angkatanValue === 'NULL' ? 'NULL' : escape($angkatanValue),
      $user['username']
    );
  } elseif ($user['role'] === 'dosen') {
    $jurusan = trim($data['jurusan'] ?? $profile['jurusan']);
    $sql = sprintf(
      "UPDATE dosen SET nama = '%s', jurusan = '%s' WHERE nip = '%s'",
      escape($name),
      escape($jurusan),
      $user['username']
    );
  } else {
    $jabatan = trim($data['jabatan'] ?? $profile['jabatan']);
    $sql = sprintf(
      "UPDATE tendik SET nama = '%s', jabatan = '%s' WHERE nip = '%s'",
      escape($name),
      escape($jabatan),
      $user['username']
    );
  }

  if (!mysqli_query($conn, $sql)) {
    send_json(['error' => mysqli_error($conn)], 500);
  }

  if ($updateUserPhoto) {
    $updateSql = sprintf(
      "UPDATE users SET profile_photo = '%s' WHERE username = '%s'",
      escape($photoPath),
      escape($user['username'])
    );
    if (!mysqli_query($conn, $updateSql)) {
      send_json(['error' => mysqli_error($conn)], 500);
    }
  }

  $user = query_fetch_one("SELECT id, username, role, profile_photo FROM users WHERE username = '" . escape($user['username']) . "' LIMIT 1");
  $profile = build_profile($user);
  send_json(['success' => true, 'profile' => $profile]);
}

method_not_allowed(['GET', 'PUT']);
