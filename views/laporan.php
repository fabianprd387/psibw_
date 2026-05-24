<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';

$total_mhs = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS count FROM mahasiswa"))['count'];
$total_dosen = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS count FROM dosen"))['count'];
$total_mk = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS count FROM mata_kuliah"))['count'];
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Laporan - SIAKAD</title>
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
        <strong>Siakad</strong> • Pantau statistik akademik dan laporan.
      </div>
    </div>
    <div class="main-content" id="main-content">
      <div class="page-header">
        <div class="page-title">
          <h1>Laporan Akademik</h1>
          <p>Ringkasan data keseluruhan untuk mahasiswa, dosen, dan matakuliah.</p>
        </div>
        <div class="main-actions">
          <button class="secondary" type="button" onclick="location.reload()">Refresh</button>
        </div>
      </div>

      <section class="summary">
        <div class="card">
          <h3>Total Mahasiswa</h3>
          <p><?php echo $total_mhs; ?></p>
        </div>
        <div class="card">
          <h3>Total Dosen</h3>
          <p><?php echo $total_dosen; ?></p>
        </div>
        <div class="card">
          <h3>Total Matakuliah</h3>
          <p><?php echo $total_mk; ?></p>
        </div>
      </section>

      <section class="table-panel">
        <h3>Catatan</h3>
        <p>Fitur laporan sedang dikembangkan. Untuk sekarang, data ringkasan ditampilkan di atas. Untuk laporan terperinci silakan gunakan menu data mahasiswa, data dosen, dan matakuliah.</p>
      </section>
    </div>
  </div>
  <script src="../assets/script.js"></script>
</body>

</html>