<?php
function delete_tendik(int $id): void {
  global $conn;
  $staff = query_fetch_one("SELECT * FROM tendik WHERE id = $id");
  if (!$staff) {
    not_found('Tendik tidak ditemukan.');
  }

  mysqli_query($conn, "DELETE FROM tendik WHERE id = $id");
  mysqli_query($conn, "DELETE FROM users WHERE username = '" . escape($staff['nip']) . "'");
  send_json(['success' => true]);
}
