<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';
$all = mysqli_query($conn, "SELECT m.*, d.nama as dosen_name FROM mata_kuliah m LEFT JOIN dosen d ON m.dosen_id = d.id ORDER BY m.id DESC");
?>
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Matakuliah - SIAKAD</title>
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
          <h1>Matakuliah</h1>
          <p>Daftar matakuliah dan pengampu.</p>
        </div>
        <div class="main-actions">
          <a class="btn btn-add" href="add_matakuliah.php">Tambah Matakuliah</a>
        </div>
      </div>
      <div class="tables">
        <section class="table-panel">
          <table>
            <tr>
              <th>ID</th>
              <th>Kode</th>
              <th>Nama MK</th>
              <th>SKS</th>
              <th>Dosen</th>
            </tr>
            <?php while ($r = mysqli_fetch_assoc($all)) { ?>
              <tr>
                <td><?php echo $r['id']; ?></td>
                <td><?php echo $r['kode_mk']; ?></td>
                <td><?php echo $r['nama_mk']; ?></td>
                <td><?php echo $r['sks']; ?></td>
                <td><?php echo $r['dosen_name']; ?></td>
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