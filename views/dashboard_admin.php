<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
    header('Location: login.php');
    exit();
}
require_once __DIR__ . '/../config/koneksi.php';

// Query untuk ringkasan
$total_mhs = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM mahasiswa"))['count'];
$total_dosen = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM dosen"))['count'];
$total_mk = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM mata_kuliah"))['count'];

// Query untuk tabel terbaru
$mhs_baru = mysqli_query($conn, "SELECT nim, nama FROM mahasiswa ORDER BY id DESC LIMIT 4");
$dosen_baru = mysqli_query($conn, "SELECT nip, nama FROM dosen ORDER BY id DESC LIMIT 2");
$mk_baru = mysqli_query($conn, "SELECT kode_mk, nama_mk FROM mata_kuliah ORDER BY id DESC LIMIT 2");
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Admin - SIAKAD</title>
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
                <strong>Siakad</strong> • Kelola data akademik dengan mudah dan cepat.
            </div>
        </div>
        <div class="main-content" id="main-content">
            <div class="page-header">
                <div class="page-title">
                    <h1>Dashboard Admin</h1>
                    <p>Manajemen data dan laporan akademik secara profesional.</p>
                </div>
                <div class="topnav">
                    <a href="dashboard_admin.php">Dashboard</a>
                    <a href="data_mahasiswa.php">Mahasiswa</a>
                    <a href="data_dosen.php">Dosen</a>
                    <a href="matakuliah.php">Matakuliah</a>
                </div>
                <div class="main-actions">
                    <button class="secondary" type="button" onclick="location.reload()">Refresh</button>
                </div>
            </div>
            <section id="section-dashboard" class="summary">
                <div class="card">
                    <h3>Total Mahasiswa</h3>
                    <p><?php echo $total_mhs; ?></p>
                    <a class="btn btn-primary" href="data_mahasiswa.php">Lihat Data</a>
                </div>
                <div class="card">
                    <h3>Total Dosen</h3>
                    <p><?php echo $total_dosen; ?></p>
                    <a class="btn btn-primary" href="data_dosen.php">Lihat Data</a>
                </div>
                <div class="card">
                    <h3>Total Matakuliah</h3>
                    <p><?php echo $total_mk; ?></p>
                    <a class="btn btn-primary" href="matakuliah.php">Lihat Data</a>
                </div>
            </section>
            <div class="tables">
                <section id="section-mahasiswa" class="table-panel">
                    <h3>Mahasiswa Terbaru</h3>
                    <table>
                        <tr>
                            <th>NIM</th>
                            <th>Nama</th>
                        </tr>
                        <?php while ($row = mysqli_fetch_assoc($mhs_baru)) { ?>
                            <tr>
                                <td><?php echo $row['nim']; ?></td>
                                <td><?php echo $row['nama']; ?></td>
                            </tr>
                        <?php } ?>
                    </table>
                    <a href="data_mahasiswa.php">Lihat Semua</a>
                </section>
                <section id="section-dosen" class="table-panel">
                    <h3>Dosen Terbaru</h3>
                    <table>
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                        </tr>
                        <?php while ($row = mysqli_fetch_assoc($dosen_baru)) { ?>
                            <tr>
                                <td><?php echo $row['nip']; ?></td>
                                <td><?php echo $row['nama']; ?></td>
                            </tr>
                        <?php } ?>
                    </table>
                    <a href="data_dosen.php">Lihat Semua</a>
                </section>
                <section id="section-mk" class="table-panel">
                    <h3>Matakuliah Terbaru</h3>
                    <table>
                        <tr>
                            <th>Kode</th>
                            <th>Nama MK</th>
                        </tr>
                        <?php while ($row = mysqli_fetch_assoc($mk_baru)) { ?>
                            <tr>
                                <td><?php echo $row['kode_mk']; ?></td>
                                <td><?php echo $row['nama_mk']; ?></td>
                            </tr>
                        <?php } ?>
                    </table>
                    <a href="matakuliah.php">Lihat Semua</a>
                </section>
            </div>
        </div>
    </div>
    <script src="../assets/script.js"></script>
</body>

</html>