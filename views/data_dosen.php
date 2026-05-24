<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';
$all = mysqli_query($conn, "SELECT * FROM dosen ORDER BY id DESC");
?>
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Data Dosen - SIAKAD</title>
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
    </div>
    <div class="main-content" id="main-content">
      <div class="page-header">
        <div class="page-title">
          <h1>Data Dosen</h1>
          <p>Daftar lengkap dosen terdaftar.</p>
        </div>
        <div class="main-actions">
          <a class="btn btn-add" href="add_dosen.php">Tambah Dosen</a>
        </div>
      </div>
      <div class="tables">
        <section class="table-panel">
          <table>
            <tr>
              <th>ID</th>
              <th>NIP</th>
              <th>Nama</th>
              <th>Jurusan</th>
            </tr>
            <?php while ($r = mysqli_fetch_assoc($all)) { ?>
              <tr>
                <td><?php echo $r['id']; ?></td>
                <td><?php echo $r['nip']; ?></td>
                <td><?php echo $r['nama']; ?></td>
                <td><?php echo $r['jurusan']; ?></td>
              </tr>
            <?php } ?>
          </table>
        </section>
      </div>
    </div>
  </div>
  <script src="../assets/script.js"></script>
</body>

</html>