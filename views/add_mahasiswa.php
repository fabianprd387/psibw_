<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $nim = mysqli_real_escape_string($conn, $_POST['nim']);
  $nama = mysqli_real_escape_string($conn, $_POST['nama']);
  $jurusan = mysqli_real_escape_string($conn, $_POST['jurusan']);
  $angkatan = (int)$_POST['angkatan'];

  // Masukkan ke tabel mahasiswa
  // Cek duplikat nim
  $exists = mysqli_query($conn, "SELECT id FROM mahasiswa WHERE nim = '$nim'");
  if (mysqli_num_rows($exists) > 0) {
    $error = 'NIM sudah terdaftar.';
  } else {
    // Tambah user untuk login (password default "password") jika belum ada
    $hash = password_hash('password', PASSWORD_DEFAULT);
    $u = mysqli_query($conn, "SELECT id FROM users WHERE username = '$nim'");
    if (mysqli_num_rows($u) == 0) {
      mysqli_query($conn, "INSERT INTO users (username, password, role) VALUES ('$nim', '$hash', 'mahasiswa')");
    }
    $sql = "INSERT INTO mahasiswa (nim, nama, jurusan, angkatan) VALUES ('$nim', '$nama', '$jurusan', $angkatan)";
    if (mysqli_query($conn, $sql)) {
      header('Location: data_mahasiswa.php');
      exit();
    } else {
      $error = 'Gagal menambahkan mahasiswa: ' . mysqli_error($conn);
    }
  }
}
?>
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Tambah Mahasiswa - SIAKAD</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>

<body>
  <div class="login-background">
    <div class="login-card">
      <h2>Tambah Mahasiswa</h2>
      <?php if (isset($error)) echo "<p class='login-error'>$error</p>"; ?>
      <form method="POST">
        <input name="nim" placeholder="NIM" required>
        <input name="nama" placeholder="Nama" required>
        <input name="jurusan" placeholder="Jurusan" required>
        <input name="angkatan" type="number" placeholder="Angkatan" required>
        <button type="submit">Simpan</button>
      </form>
      <p class="login-footer"><a href="dashboard_admin.php">Kembali ke Dashboard</a></p>
    </div>
  </div>
</body>

</html>