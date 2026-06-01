<?php
function delete_mahasiswa(int $id): void {
  global $conn;
  $student = query_fetch_one("SELECT * FROM mahasiswa WHERE id = $id");
  if (!$student) {
    not_found('Mahasiswa tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM mahasiswa WHERE id = $id");
  mysqli_query($conn, "DELETE FROM users WHERE username = '" . escape($student['nim']) . "'");
  send_json(['success' => true]);
}
