# SIAKAD - Sistem Informasi Akademik

Web aplikasi SIAKAD dengan login berdasarkan NIM/NIP dan klasifikasi mahasiswa, dosen, tendik.

## Setup Lokal
1. Import `database/schema.sql` ke MySQL (via phpMyAdmin).
2. Jalankan XAMPP, akses `http://localhost/siakad`.

## Deploy ke Railway
1. Push kode ke GitHub.
2. Buat project di Railway, connect ke repo GitHub.
3. Tambah database MySQL di Railway.
4. Set environment variables di Railway. Aplikasi sudah mendukung kedua format:
   - DB_HOST / MYSQLHOST
   - DB_USER / MYSQLUSER
   - DB_PASS / MYSQLPASSWORD
   - DB_NAME / MYSQLDATABASE
   - MYSQL_URL atau MYSQL_PUBLIC_URL juga didukung
5. Railway akan deploy otomatis.

## Fitur
- Login dengan NIM/NIP
- Dashboard berdasarkan role
- Relasi mahasiswa-mata kuliah-dosen

## Full REST API
Aplikasi sekarang berjalan sebagai REST API.
- Akses root API di `/`
- Akses resource REST di `/login`, `/mahasiswa`, `/dosen`, `/matakuliah`, `/enrollment`, `/profile`, `/password`, `/laporan`
- Folder `views/` masih ada untuk referensi, tetapi tidak lagi digunakan sebagai entry point

### Contoh endpoint
- `POST /login`
- `GET /mahasiswa`
- `GET /mahasiswa?id={id}`
- `POST /mahasiswa`
- `PUT /mahasiswa?id={id}`
- `DELETE /mahasiswa?id={id}`
- `GET /dosen`
- `GET /matakuliah`
- `GET /enrollment`
- `GET /profile?nim={nim}`
- `POST /password`
- `GET /laporan`

Gunakan `Content-Type: application/json` untuk request `POST`/`PUT`.

Contoh endpoint:
- `POST /api/login.php`
- `GET /api/mahasiswa.php`
- `GET /api/mahasiswa.php?id={id}`
- `POST /api/mahasiswa.php`
- `PUT /api/mahasiswa.php?id={id}`
- `DELETE /api/mahasiswa.php?id={id}`
- `GET /api/dosen.php`
- `GET /api/matakuliah.php`
- `GET /api/enrollment.php`
- `GET /api/profile.php?nim={nim}`
- `POST /api/password.php`
- `GET /api/laporan.php`

Gunakan `Content-Type: application/json` untuk request `POST`/`PUT`.
