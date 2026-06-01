<?php
function delete_dosen(int $id): void {
  global $conn;
  $teacher = query_fetch_one("SELECT * FROM dosen WHERE id = $id");
  if (!$teacher) {
    not_found('Dosen tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM dosen WHERE id = $id");
  mysqli_query($conn, "DELETE FROM users WHERE username = '" . escape($teacher['nip']) . "'");
  send_json(['success' => true]);
}
