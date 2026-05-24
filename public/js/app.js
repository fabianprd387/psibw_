document.addEventListener('DOMContentLoaded', function() {
    const userDataString = localStorage.getItem('userData');
    
    if (!userDataString) {
        window.location.href = '/login.html';
        return;
    }

    const userData = JSON.parse(userDataString);
    const role = userData.role;
    const content = document.getElementById('mainContent');

    if (role === 'mahasiswa' && document.getElementById('menuMahasiswa')) {
        document.getElementById('menuMahasiswa').style.display = 'none';
    }
    if (role === 'dosen' && document.getElementById('menuDosen')) {
        document.getElementById('menuDosen').style.display = 'none';
    }

    function setActiveMenu(menuId) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeMenu = document.getElementById(menuId);
        if (activeMenu) {
            activeMenu.classList.add('active');
        }
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
                            <p>Anda login sebagai: <strong>${role.toUpperCase()}</strong></p>
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

    if (document.getElementById('menuMahasiswa')) {
        document.getElementById('menuMahasiswa').addEventListener('click', function(e) {
            e.preventDefault();
            setActiveMenu('menuMahasiswa');
            
            const btnTambah = role === 'tendik' ? `<button class="btn btn-sm btn-primary">Tambah Mahasiswa</button>` : '';
            const thAksi = role === 'tendik' ? `<th>Aksi</th>` : '';
            const colspan = role === 'tendik' ? 5 : 4;

            content.innerHTML = `
                <div class="card shadow-sm">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Daftar Mahasiswa</h5>
                        ${btnTambah}
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
                                        ${thAksi}
                                    </tr>
                                </thead>
                                <tbody id="tabel-data">
                                    <tr><td colspan="${colspan}" class="text-center">Memuat data...</td></tr>
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
                        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Data kosong</td></tr>`;
                        return;
                    }
                    data.forEach(item => {
                        const tdAksi = role === 'tendik' ? `<td><button class="btn btn-sm btn-warning">Edit</button> <button class="btn btn-sm btn-danger">Hapus</button></td>` : '';
                        tbody.innerHTML += `
                            <tr>
                                <td>${item.nim || '-'}</td>
                                <td>${item.nama || '-'}</td>
                                <td>${item.jurusan || '-'}</td>
                                <td>${item.angkatan || '-'}</td>
                                ${tdAksi}
                            </tr>
                        `;
                    });
                });
        });
    }

    if (document.getElementById('menuDosen')) {
        document.getElementById('menuDosen').addEventListener('click', function(e) {
            e.preventDefault();
            setActiveMenu('menuDosen');

            const btnTambah = role === 'tendik' ? `<button class="btn btn-sm btn-primary">Tambah Dosen</button>` : '';
            const thAksi = role === 'tendik' ? `<th>Aksi</th>` : '';
            const colspan = role === 'tendik' ? 4 : 3;

            content.innerHTML = `
                <div class="card shadow-sm">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Daftar Dosen</h5>
                        ${btnTambah}
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover table-bordered align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>NIP</th>
                                        <th>Nama Lengkap</th>
                                        <th>Jurusan</th>
                                        ${thAksi}
                                    </tr>
                                </thead>
                                <tbody id="tabel-data">
                                    <tr><td colspan="${colspan}" class="text-center">Memuat data...</td></tr>
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
                        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Data kosong</td></tr>`;
                        return;
                    }
                    data.forEach(item => {
                        const tdAksi = role === 'tendik' ? `<td><button class="btn btn-sm btn-warning">Edit</button> <button class="btn btn-sm btn-danger">Hapus</button></td>` : '';
                        tbody.innerHTML += `
                            <tr>
                                <td>${item.nip || '-'}</td>
                                <td>${item.nama || '-'}</td>
                                <td>${item.jurusan || '-'}</td>
                                ${tdAksi}
                            </tr>
                        `;
                    });
                });
        });
    }

    document.getElementById('menuMatakuliah').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveMenu('menuMatakuliah');

        const btnTambah = role === 'tendik' ? `<button class="btn btn-sm btn-primary">Tambah Matkul</button>` : '';
        const thAksi = role === 'tendik' ? `<th>Aksi</th>` : '';
        const colspan = role === 'tendik' ? 5 : 4;

        content.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Daftar Mata Kuliah</h5>
                    ${btnTambah}
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
                                    ${thAksi}
                                </tr>
                            </thead>
                            <tbody id="tabel-data">
                                <tr><td colspan="${colspan}" class="text-center">Memuat data...</td></tr>
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
                    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Data kosong</td></tr>`;
                    return;
                }
                data.forEach(item => {
                    const tdAksi = role === 'tendik' ? `<td><button class="btn btn-sm btn-warning">Edit</button> <button class="btn btn-sm btn-danger">Hapus</button></td>` : '';
                    tbody.innerHTML += `
                        <tr>
                            <td>${item.kode_mk || '-'}</td>
                            <td>${item.nama_mk || '-'}</td>
                            <td>${item.sks || '-'}</td>
                            <td>${item.dosen || '-'}</td>
                            ${tdAksi}
                        </tr>
                    `;
                });
            });
    });

    document.getElementById('menuNilai').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveMenu('menuNilai');

        const btnTambah = role === 'tendik' ? `<button class="btn btn-sm btn-primary">Tambah Nilai</button>` : '';
        const thAksi = (role === 'tendik' || role === 'dosen') ? `<th>Aksi</th>` : '';
        const colspan = (role === 'tendik' || role === 'dosen') ? 6 : 5;

        content.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Data Nilai Mahasiswa</h5>
                    ${btnTambah}
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
                                    ${thAksi}
                                </tr>
                            </thead>
                            <tbody id="tabel-data">
                                <tr><td colspan="${colspan}" class="text-center">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        let fetchUrl = '/api/enrollment';
        if (role === 'mahasiswa') {
            fetchUrl = `/api/enrollment?nim=${userData.username}`;
        }

        fetch(fetchUrl)
            .then(res => res.json())
            .then(data => {
                const tbody = document.getElementById('tabel-data');
                tbody.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Data kosong</td></tr>`;
                    return;
                }
                data.forEach(item => {
                    let tdAksi = '';
                    if (role === 'tendik') {
                        tdAksi = `<td><button class="btn btn-sm btn-warning">Edit</button> <button class="btn btn-sm btn-danger">Hapus</button></td>`;
                    } else if (role === 'dosen') {
                        tdAksi = `<td><button class="btn btn-sm btn-info text-white">Input Nilai</button></td>`;
                    }

                    tbody.innerHTML += `
                        <tr>
                            <td>${item.nim || '-'}</td>
                            <td>${item.mahasiswa || '-'}</td>
                            <td>${item.nama_mk || '-'}</td>
                            <td>${item.dosen || '-'}</td>
                            <td><span class="badge bg-primary">${item.nilai || '-'}</span></td>
                            ${tdAksi}
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
});