<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION['user']) || $_SESSION['role'] != 'mahasiswa') {
    header('Location: login.php');
    exit();
}
require_once __DIR__ . '/../config/koneksi.php';

// Ambil data mahasiswa
$user_nim = mysqli_real_escape_string($conn, $_SESSION['user']);
$query = "SELECT * FROM mahasiswa WHERE nim = '$user_nim'";
$result = mysqli_query($conn, $query);

$action_message = '';
$action_error = '';

if (!$result) {
    die('Query mahasiswa gagal: ' . mysqli_error($conn));
}

$mhs = mysqli_fetch_assoc($result);
if (!$mhs) {
    header('Location: login.php');
    exit();
}

// handle enroll / unenroll actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_POST['action']) && $_POST['action'] === 'enroll' && isset($_POST['mk_id'])) {
        $mk_id = (int) $_POST['mk_id'];
        $insert = mysqli_query($conn, "INSERT INTO enrollment (mahasiswa_id, mata_kuliah_id, semester) VALUES ({$mhs['id']}, $mk_id, '2023/2024')");
        if (!$insert) {
            $action_error = 'Gagal menambahkan matakuliah: ' . mysqli_error($conn);
        } else {
            $action_message = 'Matakuliah berhasil ditambahkan.';
        }
    }
    if (!empty($_POST['action']) && $_POST['action'] === 'unenroll' && isset($_POST['enroll_id'])) {
        $enroll_id = (int) $_POST['enroll_id'];
        $delete = mysqli_query($conn, "DELETE FROM enrollment WHERE id = $enroll_id AND mahasiswa_id = {$mhs['id']}");
        if (!$delete) {
            $action_error = 'Gagal menghapus matakuliah: ' . mysqli_error($conn);
        } else {
            $action_message = 'Matakuliah berhasil dihapus.';
        }
    }
    if ($action_error === '') {
        header('Location: dashboard_mahasiswa.php');
        exit();
    }
}

// Ambil mata kuliah yang diambil (dengan info sks dan dosen)
$query_mk = "SELECT e.id as enroll_id, mk.id as mk_id, mk.nama_mk, mk.kode_mk, mk.sks, '' AS jadwal, d.nama as dosen, e.nilai
             FROM enrollment e
             JOIN mata_kuliah mk ON e.mata_kuliah_id = mk.id
             LEFT JOIN dosen d ON mk.dosen_id = d.id
             WHERE e.mahasiswa_id = {$mhs['id']}";
$mk_list_res = mysqli_query($conn, $query_mk);
$mk_rows = [];
if ($mk_list_res) {
    while ($r = mysqli_fetch_assoc($mk_list_res)) {
        $mk_rows[] = $r;
    }
}

// Ambil daftar mata kuliah yang belum diambil untuk ditambahkan
$available_q = "SELECT *, '' AS jadwal FROM mata_kuliah WHERE id NOT IN (SELECT mata_kuliah_id FROM enrollment WHERE mahasiswa_id = {$mhs['id']})";
$available_res = mysqli_query($conn, $available_q);
$available_rows = [];
if ($available_res) {
    while ($a = mysqli_fetch_assoc($available_res)) {
        $available_rows[] = $a;
    }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Mahasiswa - SIAKAD</title>
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
                <li><a href="#section-schedule">Jadwal Kuliah</a></li>
                <li><a href="#section-grades">Nilai</a></li>
                <li><a href="logout.php">Logout</a></li>
            </ul>
            <div class="sidebar-footer">
                <strong>Siakad</strong> • Pantau nilai dan jadwal kuliah Anda di satu tempat.
            </div>
        </div>
        <div class="main-content" id="main-content">
            <div class="page-header">
                <div class="page-title">
                    <h1>Selamat Malam, <?php echo explode(' ', $mhs['nama'])[0]; ?>!</h1>
                    <p>Semoga harimu menyenangkan. Berikut ringkasan akademikmu.</p>
                </div>
                <div class="main-actions">
                    <button class="secondary" type="button" onclick="location.reload()">Refresh</button>
                </div>
            </div>
            <?php
            $stats_query = "SELECT COUNT(*) AS total_mk, COALESCE(SUM(m.sks),0) AS total_sks
                      FROM enrollment e
                      JOIN mata_kuliah m ON e.mata_kuliah_id = m.id
                      WHERE e.mahasiswa_id = {$mhs['id']}";
            $stats = mysqli_fetch_assoc(mysqli_query($conn, $stats_query));
            $photo_url = isset($mhs['photo']) && !empty($mhs['photo']) && file_exists(__DIR__ . '/../uploads/' . $mhs['photo'])
                ? '../uploads/' . $mhs['photo']
                : null;
            ?>

            <?php
            // indeks nilai mapping
            $grade_map = [
                'A' => 4.00,
                'A-' => 3.75,
                'B+' => 3.50,
                'B' => 3.00,
                'B-' => 2.75,
                'C+' => 2.50,
                'C' => 2.00,
                'D' => 1.00,
                'E' => 0.00,
                'T' => 0.00
            ];

            // hitung IPK dari mata kuliah yang memiliki nilai
            $total_weight = 0.0;
            $total_sks_for_gpa = 0;
            foreach ($mk_rows as $r) {
                $nilai = trim($r['nilai'] ?? '');
                if ($nilai !== '' && isset($grade_map[$nilai]) && !empty($r['sks'])) {
                    $gp = $grade_map[$nilai];
                    $total_weight += $gp * (int)$r['sks'];
                    $total_sks_for_gpa += (int)$r['sks'];
                }
            }
            $ipk_display = $total_sks_for_gpa > 0 ? round($total_weight / $total_sks_for_gpa, 2) : '-';

            ?>

            <?php if ($action_error || $action_message) { ?>
                <div class="alert-row">
                    <?php if ($action_message) { ?>
                        <div class="alert alert-success"><?php echo $action_message; ?></div>
                    <?php } ?>
                    <?php if ($action_error) { ?>
                        <div class="alert alert-error"><?php echo $action_error; ?></div>
                    <?php } ?>
                </div>
            <?php } ?>

            <section id="section-dashboard" class="student-dashboard">
                <div class="student-panel">
                    <div class="profile-hero">
                        <div class="profile-avatar">
                            <?php if ($photo_url) { ?>
                                <img src="<?php echo $photo_url; ?>" alt="Foto Profil">
                            <?php } else { ?>
                                <span><?php echo strtoupper(substr($mhs['nama'], 0, 1)); ?></span>
                            <?php } ?>
                        </div>
                        <div class="profile-meta">
                            <h2><?php echo $mhs['nama']; ?></h2>
                            <p class="muted"><?php echo $mhs['nim']; ?></p>
                            <span class="status-pill">Aktif</span>
                            <div class="profile-actions">
                                <a href="profile_mahasiswa.php" class="btn btn-secondary">Edit Profil</a>
                            </div>
                        </div>
                    </div>
                    <div class="student-details">
                        <dl>
                            <dt>Program Studi</dt>
                            <dd><?php echo $mhs['jurusan']; ?></dd>
                            <dt>Angkatan</dt>
                            <dd><?php echo $mhs['angkatan']; ?></dd>
                            <dt>Dosen Wali</dt>
                            <dd>Belum ditentukan</dd>
                            <dt>Email</dt>
                            <dd><?php echo strtolower($mhs['nim']); ?>@siakad.local</dd>
                        </dl>
                    </div>
                </div>

                <div class="student-overview">
                    <div class="stats-grid">
                        <div class="stats-card">
                            <h3>IPK</h3>
                            <p><?php echo $ipk_display; ?></p>
                            <small><?php echo $total_sks_for_gpa > 0 ? 'Berbasis nilai terinput' : 'Belum ada nilai'; ?></small>
                        </div>
                        <div class="stats-card">
                            <h3>Matakuliah</h3>
                            <p><?php echo $stats['total_mk']; ?></p>
                            <small>Jumlah matakuliah aktif</small>
                        </div>
                        <div class="stats-card">
                            <h3>Total SKS</h3>
                            <p><?php echo $stats['total_sks']; ?></p>
                            <small>SKS terdaftar</small>
                        </div>
                    </div>
                    <div class="quick-actions">
                        <a href="#section-schedule" class="quick-card">
                            <span>Jadwal Kuliah</span>
                        </a>
                        <a href="#section-grades" class="quick-card">
                            <span>Nilai</span>
                        </a>
                        <a href="profile_mahasiswa.php" class="quick-card">
                            <span>Profil</span>
                        </a>
                    </div>
                </div>
            </section>



            <section id="section-grades" class="report-panel">
                <div class="section-title">
                    <h2>Nilai</h2>
                </div>
                <table>
                    <tr>
                        <th>Kode MK</th>
                        <th>Nama MK</th>
                        <th>Dosen</th>
                        <th>Nilai</th>
                    </tr>
                    <?php foreach ($mk_rows as $row) { ?>
                        <tr>
                            <td><?php echo $row['kode_mk']; ?></td>
                            <td><?php echo $row['nama_mk']; ?></td>
                            <td><?php echo $row['dosen']; ?></td>
                            <td><?php echo $row['nilai'] ?: '-'; ?></td>
                        </tr>
                    <?php } ?>
                </table>
            </section>

            <section id="section-manage" class="table-panel">
                <div class="section-title">
                    <h2>Kelola Matakuliah</h2><span>Tambahkan atau hapus matakuliah yang Anda ikuti</span>
                </div>
                <div style="display:grid;gap:12px;">
                    <div>
                        <h4>Matakuliah Terdaftar</h4>
                        <table>
                            <tr>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>SKS</th>
                                <th>Jadwal</th>
                                <th>Aksi</th>
                            </tr>
                            <?php foreach ($mk_rows as $r) { ?>
                                <tr>
                                    <td><?php echo $r['kode_mk']; ?></td>
                                    <td><?php echo $r['nama_mk']; ?></td>
                                    <td><?php echo $r['sks']; ?></td>
                                    <td><?php echo $r['jadwal'] ?: '-'; ?></td>
                                    <td>
                                        <form method="post" action="" style="display:inline;">
                                            <input type="hidden" name="action" value="unenroll">
                                            <input type="hidden" name="enroll_id"
                                                value="<?php echo htmlspecialchars($r['enroll_id'], ENT_QUOTES); ?>">
                                            <button class="btn btn-secondary" type="submit">Hapus</button>
                                        </form>
                                    </td>
                                </tr>
                            <?php } ?>
                        </table>
                    </div>

                    <div>
                        <h4>Tambahkan Matakuliah</h4>
                        <table>
                            <tr>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>SKS</th>
                                <th>Jadwal</th>
                                <th>Aksi</th>
                            </tr>
                            <?php if (count($available_rows) > 0) {
                                foreach ($available_rows as $a) { ?>
                                    <tr>
                                        <td><?php echo $a['kode_mk']; ?></td>
                                        <td><?php echo $a['nama_mk']; ?></td>
                                        <td><?php echo $a['sks']; ?></td>
                                        <td><?php echo $a['jadwal'] ?: '-'; ?></td>
                                        <td>
                                            <form method="post" action="" style="display:inline;">
                                                <input type="hidden" name="action" value="enroll">
                                                <input type="hidden" name="mk_id" value="<?php echo htmlspecialchars($a['id'], ENT_QUOTES); ?>">
                                                <button class="btn btn-primary" type="submit">Tambah</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php }
                            } else { ?>
                                <tr>
                                    <td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">Semua matakuliah
                                        sudah terdaftar atau tidak tersedia.</td>
                                </tr>
                            <?php } ?>
                        </table>
                    </div>
                </div>
            </section>

            <section id="section-schedule" class="report-panel">
                <div class="section-title">
                    <h2>Jadwal Kuliah</h2>
                    <a href="#section-grades">Lihat Nilai</a>
                </div>
                <?php if (count($mk_rows) > 0) { ?>
                    <table>
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                            <th>Jadwal</th>
                        </tr>
                        <?php foreach ($mk_rows as $r) { ?>
                            <tr>
                                <td><?php echo $r['kode_mk']; ?></td>
                                <td><?php echo $r['nama_mk']; ?></td>
                                <td><?php echo $r['jadwal'] ?: '-'; ?></td>
                            </tr>
                        <?php } ?>
                    </table>
                <?php } else { ?>
                    <p>Belum ada jadwal terdaftar. Tambahkan matakuliah untuk melihat jadwal.</p>
                <?php } ?>
            </section>
        </div>
    </div>
    <script src="../assets/script.js"></script>
</body>

</html>