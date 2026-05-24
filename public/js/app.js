const userData = JSON.parse(localStorage.getItem('userData'));

if (!userData) {
    window.location.href = '/login.html';
}

if (userData.role === 'mahasiswa') {
    document.getElementById('menuMahasiswa').style.display = 'none';
    document.getElementById('menuDosen').style.display = 'none';
}

const content = document.getElementById('mainContent');

function setActiveMenu(menuId) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(menuId).classList.add('active');
}

document.getElementById('menuDashboard').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenu('menuDashboard');

    content.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h3>Selamat Datang, ${userData.username}!</h3>
                        <p>Anda login sebagai: <strong>${userData.role.toUpperCase()}</strong></p>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" id="laporanCards">
            <div class="col-12 text-center"><p>Memuat data...</p></div>
        </div>
    `;

    fetch('/api/laporan')
        .then(res => res.json())
        .then(data => {
            document.getElementById('laporanCards').innerHTML = `
                <div class="col-md-3 mb-3">
                    <div class="card bg-primary text-white text-center shadow-sm h-100">
                        <div class="card-body">
                            <h1 class="display-4">${data.total_mahasiswa || 0}</h1>
                            <h5>Mahasiswa</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-success text-white text-center shadow-sm h-100">
                        <div class="card-body">
                            <h1 class="display-4">${data.total_dosen || 0}</h1>
                            <h5>Dosen</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-warning text-dark text-center shadow-sm h-100">
                        <div class="card-body">
                            <h1 class="display-4">${data.total_matakuliah || 0}</h1>
                            <h5>Mata Kuliah</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-info text-white text-center shadow-sm h-100">
                        <div class="card-body">
                            <h1 class="display-4">${data.total_nilai || 0}</h1>
                            <h5>Data Nilai</h5>
                        </div>
                    </div>
                </div>
            `;
        });
});

document.getElementById('menuMahasiswa').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenu('menuMahasiswa');
    content.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">Daftar Mahasiswa</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>NIM</th>
                                <th>Nama</th>
                                <th>Jurusan</th>
                                <th>Angkatan</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-data">
                            <tr><td colspan="4" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetch('/api/mahasiswa')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabel-data');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Data kosong</td></tr>';
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nim || '-'}</td>
                        <td>${item.nama || '-'}</td>
                        <td>${item.jurusan || '-'}</td>
                        <td>${item.angkatan || '-'}</td>
                    </tr>
                `;
            });
        });
});

document.getElementById('menuDosen').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenu('menuDosen');
    content.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">Daftar Dosen</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>NIP</th>
                                <th>Nama Lengkap</th>
                                <th>Jurusan</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-data">
                            <tr><td colspan="3" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetch('/api/dosen')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabel-data');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center">Data kosong</td></tr>';
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nip || '-'}</td>
                        <td>${item.nama || '-'}</td>
                        <td>${item.jurusan || '-'}</td>
                    </tr>
                `;
            });
        });
});

document.getElementById('menuMatakuliah').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenu('menuMatakuliah');
    content.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">Daftar Mata Kuliah</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Kode MK</th>
                                <th>Nama Mata Kuliah</th>
                                <th>SKS</th>
                                <th>Dosen Pengampu</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-data">
                            <tr><td colspan="4" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetch('/api/matakuliah')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabel-data');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Data kosong</td></tr>';
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.kode_mk || '-'}</td>
                        <td>${item.nama_mk || '-'}</td>
                        <td>${item.sks || '-'}</td>
                        <td>${item.dosen || '-'}</td>
                    </tr>
                `;
            });
        });
});

document.getElementById('menuNilai').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveMenu('menuNilai');
    content.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">Data Nilai Mahasiswa</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>NIM</th>
                                <th>Nama Mahasiswa</th>
                                <th>Mata Kuliah</th>
                                <th>Dosen</th>
                                <th>Nilai</th>
                            </tr>
                        </thead>
                        <tbody id="tabel-data">
                            <tr><td colspan="5" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    let fetchUrl = '/api/enrollment';
    
    if (userData.role === 'mahasiswa') {
        fetchUrl = `/api/enrollment?nim=${userData.username}`;
    }

    fetch(fetchUrl)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabel-data');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Data kosong</td></tr>';
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nim || '-'}</td>
                        <td>${item.mahasiswa || '-'}</td>
                        <td>${item.nama_mk || '-'}</td>
                        <td>${item.dosen || '-'}</td>
                        <td><span class="badge bg-primary">${item.nilai || '-'}</span></td>
                    </tr>
                `;
            });
        });
});

document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('userData');
    window.location.href = '/login.html';
});

document.getElementById('menuDashboard').click();