<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $current = $_POST['current_password'] ?? '';
  $new = $_POST['new_password'] ?? '';
  $confirm = $_POST['confirm_password'] ?? '';

  if ($new !== $confirm) {
    $error = 'Password baru dan konfirmasi tidak cocok.';
  } else {
    $user = mysqli_fetch_assoc(mysqli_query($conn, "SELECT password FROM users WHERE username = '{$_SESSION['user']}'"));
    if (!$user || !password_verify($current, $user['password'])) {
      $error = 'Password saat ini salah.';
    } else {
      $hash = password_hash($new, PASSWORD_DEFAULT);
      if (mysqli_query($conn, "UPDATE users SET password = '$hash' WHERE username = '{$_SESSION['user']}'")) {
        $success = 'Password berhasil diperbarui.';
      } else {
        $error = 'Terjadi kesalahan saat menyimpan password baru.';
      }
    }
  }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Ganti Password - SIAKAD</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>

<body>
  <div class="app-shell">
    <div class="sidebar">
      <div class="brand">
        <h2>Siakad</h2>
        <p>Sistem Informasi Akademik</p>
      </div>
      <button id="sidebar-toggle-btn" class="sidebar-toggle" aria-expanded="true">☰</button>
      <ul>
        <li><a href="dashboard_admin.php">Dashboard</a></li>
        <li><a href="data_mahasiswa.php">Data Mahasiswa</a></li>
        <li><a href="data_dosen.php">Data Dosen</a></li>
        <li><a href="matakuliah.php">Matakuliah</a></li>
        <li><a href="laporan.php">Laporan</a></li>
        <li><a href="ganti_password.php">Ganti Password</a></li>
        <li><a href="logout.php">Logout</a></li>
      </ul>
      <div class="sidebar-footer">
        <strong>Siakad</strong> • Amankan akun tendik Anda.
      </div>
    </div>
    <div class="main-content" id="main-content">
      <div class="page-header">
        <div class="page-title">
          <h1>Ganti Password</h1>
          <p>Ubah password tendik untuk keamanan akun Anda.</p>
        </div>
      </div>

      <section class="report-panel">
        <?php if (!empty($success)) { ?>
          <div class="card" style="background: #ecfdf5; color: #166534;">
            <?php echo $success; ?>
          </div>
        <?php } ?>
        <?php if (!empty($error)) { ?>
          <div class="card" style="background: #fee2e2; color: #991b1b;">
            <?php echo $error; ?>
          </div>
        <?php } ?>

        <form action="" method="post" style="display: grid; gap: 18px; max-width: 480px;">
          <label>
            <span>Password Saat Ini</span>
            <input type="password" name="current_password" required>
          </label>
          <label>
            <span>Password Baru</span>
            <input type="password" name="new_password" required>
          </label>
          <label>
            <span>Konfirmasi Password Baru</span>
            <input type="password" name="confirm_password" required>
          </label>
          <div class="profile-actions">
            <button class="btn btn-primary" type="submit">Simpan Password</button>
            <a href="dashboard_admin.php" class="btn btn-secondary">Kembali</a>
          </div>
        </form>
      </section>
    </div>
  </div>
  <script src="../assets/script.js"></script>
</body>

</html>