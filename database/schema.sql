CREATE DATABASE IF NOT EXISTS siakad;
USE siakad;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL, 
    password VARCHAR(255) NOT NULL,
    role ENUM('mahasiswa', 'dosen', 'tendik') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE mahasiswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jurusan VARCHAR(50),
    angkatan YEAR,
    FOREIGN KEY (nim) REFERENCES users(username) ON DELETE CASCADE
);


CREATE TABLE dosen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jurusan VARCHAR(50),
    FOREIGN KEY (nip) REFERENCES users(username) ON DELETE CASCADE
);


CREATE TABLE tendik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(50),
    FOREIGN KEY (nip) REFERENCES users(username) ON DELETE CASCADE
);


CREATE TABLE mata_kuliah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_mk VARCHAR(10) UNIQUE NOT NULL,
    nama_mk VARCHAR(100) NOT NULL,
    sks INT NOT NULL,
    dosen_id INT,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE SET NULL
);


CREATE TABLE enrollment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    mata_kuliah_id INT NOT NULL,
    semester VARCHAR(10),
    nilai VARCHAR(2),
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE
);


INSERT INTO users (username, password, role) VALUES
('2403125938', '$2y$10$ie2uRylifJjWsuTovY4G7edJj9iLCNtbGcBZIBZUnsL/h2/G8ApXu', 'mahasiswa'),
('67890', '$2y$10$q2eOrmTbvF3ss9C.B6dnb.aZwKox89yV/XR9Lr.hREMjoTsbaq156', 'dosen'),
('11111', '$2y$10$I931SCKyvtaLucxbFqmpruQs.dQNK7T9b8gAK7fqup.qZvVTtbbru', 'tendik');

INSERT INTO mahasiswa (nim, nama, jurusan, angkatan) VALUES ('2403125938', 'John Doe', 'Informatika', 2020);
INSERT INTO dosen (nip, nama, jurusan) VALUES ('67890', 'Dr. Jane Smith', 'Informatika');
INSERT INTO tendik (nip, nama, jabatan) VALUES ('11111', 'Admin Staff', 'Administrator');

INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, dosen_id) VALUES
('IF101', 'Pemrograman Dasar', 3, 1),
('IF102', 'Basis Data', 3, 1);

INSERT INTO enrollment (mahasiswa_id, mata_kuliah_id, semester) VALUES (1, 1, 'Ganjil');