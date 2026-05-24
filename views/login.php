<?php
session_start();
require_once __DIR__ . '/../config/koneksi.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Gunakan real_escape_string biar aman dari karakter aneh
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = $_POST['password'];

    $query = "SELECT * FROM users WHERE username = '$username'";
    $result = mysqli_query($conn, $query);

    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        $isPasswordValid = false;

        if (password_verify($password, $user['password'])) {
            $isPasswordValid = true;
        } elseif ($password === $user['password']) {
            // Jika password masih disimpan dalam teks biasa, terima dan upgrade ke hash
            $isPasswordValid = true;
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            mysqli_query($conn, "UPDATE users SET password = '$newHash' WHERE id = {$user['id']}");
        }

        if ($isPasswordValid) {
            $_SESSION['user'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            if ($user['role'] === 'tendik') {
                header('Location: dashboard_admin.php');
            } elseif ($user['role'] === 'dosen') {
                header('Location: dashboard_dosen.php');
            } elseif ($user['role'] === 'mahasiswa') {
                header('Location: dashboard_mahasiswa.php');
            } else {
                header('Location: ../index.php');
            }
            exit();
        } else {
            $error = "Password salah!";
        }
    } else {
        $error = "Username tidak ditemukan!";
    }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Login SIAKAD</title>
    <link rel="stylesheet" href="../assets/style.css">
</head>

<body class="login-background">
    <div class="login-card">
        <h2>Login SIAKAD</h2>
        <p>Masuk untuk mengelola data akademik dan melihat dashboard Anda.</p>
        <?php if (isset($error)) echo "<p class='login-error'>$error</p>"; ?>
        <form method="POST">
            <input type="text" name="username" placeholder="NIM / NIP" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Masuk</button>
        </form>
        <p class="login-footer">Gunakan data akun yang terdaftar di sistem.</p>
    </div>
</body>

</html>