<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['role'] != 'tendik') {
  header('Location: login.php');
  exit();
}
require_once __DIR__ . '/../config/koneksi.php';
$dosens = mysqli_query($conn, "SELECT id, nama FROM dosen ORDER BY nama");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $kode = mysqli_real_escape_string($conn, $_POST['kode_mk']);
  $nama = mysqli_real_escape_string($conn, $_POST['nama_mk']);
  $sks = (int)$_POST['sks'];
  $dosen_id = (int)$_POST['dosen_id'];
  $sql = "INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, dosen_id) VALUES ('$kode', '$nama', $sks, $dosen_id)";
  if (mysqli_query($conn, $sql)) {
    header('Location: matakuliah.php');
    exit();
  } else {
    $error = 'Gagal menambahkan matakuliah: ' . mysqli_error($conn);
  }
}
?>
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Tambah Matakuliah - SIAKAD</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>

<body>
  <div class="login-background">
    <div class="login-card">
      <h2>Tambah Matakuliah</h2>
      <?php if (isset($error)) echo "<p class='login-error'>$error</p>"; ?>
      <form method="POST">
        <input name="kode_mk" placeholder="Kode Matakuliah" required>
        <input name="nama_mk" placeholder="Nama Matakuliah" required>
        <input name="sks" type="number" placeholder="SKS" required>
        <select name="dosen_id" required>
          <option value="">-- Pilih Dosen --</option>
          <?php while ($d = mysqli_fetch_assoc($dosens)) { ?>
            <option value="<?php echo $d['id']; ?>"><?php echo $d['nama']; ?></option>
          <?php } ?>
        </select>
        <button type="submit" class="btn btn-add">Simpan</button>
      </form>
      <p class="login-footer"><a href="matakuliah.php">Kembali ke Matakuliah</a></p>
    </div>
  </div>
</body>

</html>