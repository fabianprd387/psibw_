<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'dosen') {
    header('Location: login.php');
    exit();
}
require_once __DIR__ . '/../config/koneksi.php';

// Ambil data dosen
$query = "SELECT * FROM dosen WHERE nip = '{$_SESSION['user']}'";
$dosen = mysqli_fetch_assoc(mysqli_query($conn, $query));

// Ambil mata kuliah yang diajar
$query_mk = "SELECT * FROM mata_kuliah WHERE dosen_id = {$dosen['id']}";
$mk_list = mysqli_query($conn, $query_mk);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Dosen - SIAKAD</title>
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
                <li><a href="#section-dashboard">Dashboard</a></li>
                <li><a href="#section-courses">Mata Kuliah</a></li>
                <li><a href="input_nilai.php">Input Nilai</a></li>
                <li><a href="logout.php">Logout</a></li>
            </ul>
            <div class="sidebar-footer">
                <strong>Siakad</strong> • Pantau pengajaran dan nilai mahasiswa dengan cepat.
            </div>
        </div>
        <div class="main-content" id="main-content">
            <div class="page-header">
                <div class="page-title">
                    <h1>Dashboard Dosen</h1>
                    <p>Ringkasan matakuliah dan kelas yang sedang Anda ampu.</p>
                </div>
                <div class="topnav">
                    <a href="#section-dashboard">Dashboard</a>
                    <a href="#section-courses">Mata Kuliah</a>
                    <a href="input_nilai.php">Input Nilai</a>
                </div>
                <div class="main-actions">
                    <button class="secondary" type="button" onclick="location.reload()">Refresh</button>
                </div>
            </div>
            <section id="section-dashboard" class="summary">
                <div class="card">
                    <h3>NIP</h3>
                    <p><?php echo $dosen['nip']; ?></p>
                </div>
                <div class="card">
                    <h3>Jurusan</h3>
                    <p><?php echo $dosen['jurusan']; ?></p>
                </div>
            </section>
            <section id="section-courses" class="table-panel">
                <h3>Mata Kuliah yang Diajar</h3>
                <table>
                    <tr>
                        <th>Kode MK</th>
                        <th>Nama MK</th>
                        <th>SKS</th>
                    </tr>
                    <?php while ($row = mysqli_fetch_assoc($mk_list)) { ?>
                        <tr>
                            <td><?php echo $row['kode_mk']; ?></td>
                            <td><?php echo $row['nama_mk']; ?></td>
                            <td><?php echo $row['sks']; ?></td>
                        </tr>
                    <?php } ?>
                </table>
            </section>
        </div>
    </div>
    <script src="../assets/script.js"></script>
</body>

</html>