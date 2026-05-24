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

if (!$dosen) {
  echo "Dosen tidak ditemukan.";
  exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['enrollment_id'])) {
  $enrollment_id = (int)$_POST['enrollment_id'];
  $nilai = mysqli_real_escape_string($conn, $_POST['nilai']);
  mysqli_query($conn, "UPDATE enrollment SET nilai = '$nilai' WHERE id = $enrollment_id");
  header('Location: input_nilai.php');
  exit();
}

// Ambil daftar enrollment untuk matakuliah yang diajar dosen
$sql = "SELECT e.id as enrollment_id, m.kode_mk, m.nama_mk, s.nim, s.nama, e.nilai
        FROM enrollment e
        JOIN mata_kuliah m ON e.mata_kuliah_id = m.id
        JOIN mahasiswa s ON e.mahasiswa_id = s.id
        WHERE m.dosen_id = {$dosen['id']}
        ORDER BY m.nama_mk, s.nama";
$res = mysqli_query($conn, $sql);
?>
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Input Nilai - SIAKAD</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>

<body>
  <div class="app-shell">
    <div class="main-content" style="width:100%;margin-left:0;padding:40px;">
      <h2>Input Nilai</h2>
      <p>Matakuliah yang Anda ampu dan daftar mahasiswa terdaftar.</p>
      <div class="grade-reference">
        <h3>Keterangan Nilai</h3>
        <div class="grade-grid">
          <div><strong>A</strong><span>4.00</span></div>
          <div><strong>A-</strong><span>3.75</span></div>
          <div><strong>B+</strong><span>3.50</span></div>
          <div><strong>B</strong><span>3.00</span></div>
          <div><strong>B-</strong><span>2.75</span></div>
          <div><strong>C+</strong><span>2.50</span></div>
          <div><strong>C</strong><span>2.00</span></div>
          <div><strong>D</strong><span>1.00</span></div>
          <div><strong>E</strong><span>0.00</span></div>
          <div><strong>T</strong><span>0.00</span></div>
        </div>
      </div>
      <table>
        <tr>
          <th>Kode MK</th>
          <th>Nama MK</th>
          <th>NIM</th>
          <th>Nama</th>
          <th>Nilai</th>
          <th>Aksi</th>
        </tr>
        <?php while ($row = mysqli_fetch_assoc($res)) { ?>
          <tr>
            <td><?php echo $row['kode_mk']; ?></td>
            <td><?php echo $row['nama_mk']; ?></td>
            <td><?php echo $row['nim']; ?></td>
            <td><?php echo $row['nama']; ?></td>
            <td><?php echo $row['nilai'] ?: '-'; ?></td>
            <td>
              <form method="POST" style="display:inline-block">
                <input type="hidden" name="enrollment_id" value="<?php echo $row['enrollment_id']; ?>">
                <input name="nilai" placeholder="A/B/C/D/E" style="width:80px" required>
                <button type="submit">Simpan</button>
              </form>
            </td>
          </tr>
        <?php } ?>
      </table>
      <p><a href="dashboard_dosen.php">Kembali ke Dashboard</a></p>
    </div>
  </div>
</body>

</html>