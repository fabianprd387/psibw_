const API_ROOT = (() => {
    const path = window.location.pathname;
    if (path.includes('/public/') || path.endsWith('/login.html')) {
        return new URL('../api', window.location.href).pathname.replace(/\/$/, '');
    }
    return new URL('api', window.location.href).pathname.replace(/\/$/, '');
})();
const mainContent = document.getElementById('mainContent');
const mainMenu = document.getElementById('mainMenu');
const btnLogout = document.getElementById('btnLogout');
const userDisplay = document.getElementById('userDisplay');

const entityModal = new bootstrap.Modal(document.getElementById('entityModal'));
const entityModalTitle = document.getElementById('entityModalTitle');
const entityModalBody = document.getElementById('entityModalBody');
const entityModalFooter = document.getElementById('entityModalFooter');

let currentUser = null;
let currentSection = 'dashboard';
let currentTeacherId = null;

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('siakadUser') || 'null');
    } catch {
        return null;
    }
}

function redirectToLogin() {
    localStorage.removeItem('siakadUser');
    window.location.href = 'login.html';
}

function showAlert(message, type = 'danger') {
    mainContent.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}

function fetchJson(url, options = {}) {
    return fetch(url, options).then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(data?.error || 'Terjadi kesalahan API');
        }
        return data;
    });
}

function parseImportFile(file) {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        throw new Error('Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Tidak dapat membaca file.'));
        reader.onload = () => {
            try {
                let workbook;
                if (fileName.endsWith('.csv')) {
                    workbook = XLSX.read(reader.result, { type: 'string' });
                } else {
                    const data = new Uint8Array(reader.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }

                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    throw new Error('File tidak memiliki sheet yang valid.');
                }
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        if (fileName.endsWith('.csv')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

function buildMenu() {
    const role = currentUser.role;
    const menus = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
        ...(role === 'mahasiswa' ? [
            { id: 'dosen', label: 'Dosen', icon: 'fa-chalkboard-teacher' },
            { id: 'matakuliah', label: 'Mata Kuliah', icon: 'fa-book' },
            { id: 'nilai', label: 'Nilai', icon: 'fa-graduation-cap' },
        ] : []),
        ...(role === 'dosen' ? [
            { id: 'mahasiswa', label: 'Mahasiswa', icon: 'fa-users' },
            { id: 'matakuliah', label: 'Jadwal', icon: 'fa-calendar-alt' },
            { id: 'nilai', label: 'Nilai', icon: 'fa-pen' },
        ] : []),
        ...(role === 'tendik' ? [
            { id: 'mahasiswa', label: 'Mahasiswa', icon: 'fa-users' },
            { id: 'dosen', label: 'Dosen', icon: 'fa-chalkboard-teacher' },
            { id: 'matakuliah', label: 'Mata Kuliah', icon: 'fa-book' },
            { id: 'enrollment', label: 'Enrollment', icon: 'fa-clipboard-list' },
            { id: 'nilai', label: 'Nilai', icon: 'fa-graduation-cap' },
            { id: 'import', label: 'Import CSV', icon: 'fa-file-import' },
        ] : []),
        { id: 'profile', label: 'Profile', icon: 'fa-user' }
    ];

    mainMenu.innerHTML = menus.map(menu => `
        <li class="nav-item">
            <a class="nav-link text-white" href="#" data-section="${menu.id}">
                <i class="fas ${menu.icon} me-2"></i>${menu.label}
            </a>
        </li>
    `).join('');

    document.querySelectorAll('#mainMenu .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            setSection(this.dataset.section);
        });
    });
}

function setSection(section) {
    currentSection = section;
    document.querySelectorAll('#mainMenu .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });

    if (section === 'dashboard') renderDashboard();
    if (section === 'mahasiswa') renderMahasiswa();
    if (section === 'dosen') renderDosen();
    if (section === 'matakuliah') renderMatakuliah();
    if (section === 'nilai') renderNilai();
    if (section === 'enrollment') renderEnrollment();
    if (section === 'import') renderImport();
    if (section === 'profile') renderProfile();
}

function logout() {
    localStorage.removeItem('siakadUser');
    window.location.href = 'login.html';
}

async function loadUserContext() {
    currentUser = getUser();
    if (!currentUser || !currentUser.role) {
        redirectToLogin();
        return;
    }

    userDisplay.textContent = `${currentUser.username} (${currentUser.role})`;
    buildMenu();

    if (currentUser.role === 'dosen') {
        const teacher = await fetchJson(`${API_ROOT}/dosen?nip=${encodeURIComponent(currentUser.username)}`).catch(() => null);
        currentTeacherId = teacher?.id || null;
    }

    setSection('dashboard');
}

function renderDashboard() {
    mainContent.innerHTML = `
        <div class="row gy-4">
            <div class="col-12">
                <div class="card shadow-sm p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 class="mb-1">Dashboard</h3>
                            <p class="text-muted mb-0">Ringkasan akademik untuk role <strong>${currentUser.role}</strong>.</p>
                        </div>
                        <span class="badge bg-secondary text-uppercase">${currentUser.role}</span>
                    </div>
                    <div class="row" id="dashboardCards">
                        <div class="col-12 text-center py-5 text-muted">Memuat data...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    fetchJson(`${API_ROOT}/laporan`)
        .then(data => {
            document.getElementById('dashboardCards').innerHTML = `
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-3 text-center h-100">
                        <div class="text-secondary">Mahasiswa</div>
                        <h2 class="mt-2">${data.total_mahasiswa || 0}</h2>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-3 text-center h-100">
                        <div class="text-secondary">Dosen</div>
                        <h2 class="mt-2">${data.total_dosen || 0}</h2>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-3 text-center h-100">
                        <div class="text-secondary">Mata Kuliah</div>
                        <h2 class="mt-2">${data.total_matakuliah || 0}</h2>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-3 text-center h-100">
                        <div class="text-secondary">Nilai</div>
                        <h2 class="mt-2">${data.total_nilai || 0}</h2>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            document.getElementById('dashboardCards').innerHTML = `<div class="col-12 text-center text-danger">Tidak dapat memuat data.</div>`;
        });
}

function renderMahasiswa() {
    const canEdit = currentUser.role === 'tendik';
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Daftar Mahasiswa</h5>
                ${canEdit ? '<button class="btn btn-primary btn-sm" id="addMahasiswaBtn"><i class="fas fa-plus me-2"></i>Tambah Mahasiswa</button>' : ''}
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light"><tr><th>NIM</th><th>Nama</th><th>Jurusan</th><th>Angkatan</th>${canEdit ? '<th>Aksi</th>' : ''}</tr></thead>
                        <tbody id="mahasiswaBody"><tr><td colspan="${canEdit ? 5 : 4}" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetchJson(`${API_ROOT}/mahasiswa`)
        .then(data => {
            const tbody = document.getElementById('mahasiswaBody');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${canEdit ? 5 : 4}" class="text-center">Data Mahasiswa kosong.</td></tr>`;
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nim || '-'}</td>
                        <td>${item.nama || '-'}</td>
                        <td>${item.jurusan || '-'}</td>
                        <td>${item.angkatan || '-'}</td>
                        ${canEdit ? `<td>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="openMahasiswaModal(${item.id})">Edit</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteMahasiswa(${item.id})">Hapus</button>
                        </td>` : ''}
                    </tr>
                `;
            });
            if (canEdit) document.getElementById('addMahasiswaBtn').addEventListener('click', () => openMahasiswaModal());
        })
        .catch(() => showAlert('Gagal memuat data mahasiswa.'));
}

function renderDosen() {
    const canEdit = currentUser.role === 'tendik';
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Daftar Dosen</h5>
                ${canEdit ? '<button class="btn btn-primary btn-sm" id="addDosenBtn"><i class="fas fa-plus me-2"></i>Tambah Dosen</button>' : ''}
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light"><tr><th>NIP</th><th>Nama</th><th>Jurusan</th>${canEdit ? '<th>Aksi</th>' : ''}</tr></thead>
                        <tbody id="dosenBody"><tr><td colspan="${canEdit ? 4 : 3}" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    fetchJson(`${API_ROOT}/dosen`)
        .then(data => {
            const tbody = document.getElementById('dosenBody');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${canEdit ? 4 : 3}" class="text-center">Data Dosen kosong.</td></tr>`;
                return;
            }
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.nip || '-'}</td>
                        <td>${item.nama || '-'}</td>
                        <td>${item.jurusan || '-'}</td>
                        ${canEdit ? `<td>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="openDosenModal(${item.id})">Edit</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteDosen(${item.id})">Hapus</button>
                        </td>` : ''}
                    </tr>
                `;
            });
            if (canEdit) document.getElementById('addDosenBtn').addEventListener('click', () => openDosenModal());
        })
        .catch(() => showAlert('Gagal memuat data dosen.'));
}

function renderMatakuliah() {
    const canEdit = currentUser.role === 'tendik';
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Daftar Mata Kuliah</h5>
                ${canEdit ? '<button class="btn btn-primary btn-sm" id="addMatakuliahBtn"><i class="fas fa-plus me-2"></i>Tambah Matakuliah</button>' : ''}
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light"><tr><th>Kode MK</th><th>Nama</th><th>SKS</th><th>Dosen</th>${canEdit ? '<th>Aksi</th>' : ''}</tr></thead>
                        <tbody id="matakuliahBody"><tr><td colspan="${canEdit ? 5 : 4}" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    Promise.all([fetchJson(`${API_ROOT}/matakuliah`), fetchJson(`${API_ROOT}/dosen`)]).then(([courses, dosen]) => {
        const tbody = document.getElementById('matakuliahBody');
        tbody.innerHTML = '';
        if (!Array.isArray(courses) || courses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${canEdit ? 5 : 4}" class="text-center">Data matakuliah kosong.</td></tr>`;
            return;
        }
        courses.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.kode_mk || '-'}</td>
                    <td>${item.nama_mk || '-'}</td>
                    <td>${item.sks || '-'}</td>
                    <td>${item.dosen || '-'}</td>
                    ${canEdit ? `<td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openMatakuliahModal(${item.id})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMatakuliah(${item.id})">Hapus</button>
                    </td>` : ''}
                </tr>
            `;
        });
        if (canEdit) document.getElementById('addMatakuliahBtn').addEventListener('click', () => openMatakuliahModal());
    }).catch(() => showAlert('Gagal memuat data matakuliah.'));
}

function renderNilai() {
    const isMahasiswa = currentUser.role === 'mahasiswa';
    const isDosen = currentUser.role === 'dosen';
    const isTendik = currentUser.role === 'tendik';
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mb-0">Nilai Mahasiswa</h5>
                    <p class="text-muted mb-0">${isMahasiswa ? 'Lihat nilai Anda.' : isDosen ? 'Berikan atau edit nilai.' : 'Kelola nilai untuk semua mahasiswa.'}</p>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light"><tr><th>NIM</th><th>Mahasiswa</th><th>Mata Kuliah</th><th>Dosen</th><th>Nilai</th>${isDosen || isTendik ? '<th>Aksi</th>' : ''}</tr></thead>
                        <tbody id="nilaiBody"><tr><td colspan="${isDosen || isTendik ? 6 : 5}" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    let url = `${API_ROOT}/enrollment`;
    if (isMahasiswa) url += `?nim=${encodeURIComponent(currentUser.username)}`;

    fetchJson(url)
        .then(data => {
            const tbody = document.getElementById('nilaiBody');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${isDosen || isTendik ? 6 : 5}" class="text-center">Data nilai kosong.</td></tr>`;
                return;
            }
            data.forEach(item => {
                const actionCell = isDosen || isTendik ? `
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openNilaiModal(${item.id}, '${item.nilai || ''}')">Edit</button>
                        ${isTendik ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteNilai(${item.id})">Hapus</button>` : ''}
                    </td>` : '';

                tbody.innerHTML += `
                    <tr>
                        <td>${item.nim || '-'}</td>
                        <td>${item.mahasiswa || '-'}</td>
                        <td>${item.nama_mk || '-'}</td>
                        <td>${item.dosen || '-'}</td>
                        <td>${item.nilai || '-'}</td>
                        ${actionCell}
                    </tr>
                `;
            });
        })
        .catch(() => showAlert('Gagal memuat data nilai.'));
}

function renderEnrollment() {
    if (currentUser.role !== 'tendik') {
        showAlert('Akses hanya untuk tendik.');
        return;
    }

    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mb-0">Enrollment</h5>
                    <p class="text-muted mb-0">Tambahkan atau hapus data nilai dan pendaftaran.</p>
                </div>
                <button class="btn btn-primary btn-sm" id="addEnrollmentBtn"><i class="fas fa-plus me-2"></i>Tambah Enrollment</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light"><tr><th>ID</th><th>NIM</th><th>Mahasiswa</th><th>Mata Kuliah</th><th>Dosen</th><th>Nilai</th><th>Aksi</th></tr></thead>
                        <tbody id="enrollmentBody"><tr><td colspan="7" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('addEnrollmentBtn').addEventListener('click', openEnrollmentModal);
    loadEnrollmentData();
}

function renderImport() {
    if (currentUser.role !== 'tendik') {
        showAlert('Akses hanya untuk tendik.');
        return;
    }

    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header">
                <h5 class="mb-0">Import CSV / Excel</h5>
            </div>
            <div class="card-body">
                <p class="text-muted">Upload file CSV, XLSX, atau XLS untuk menambahkan data mahasiswa, dosen, atau matakuliah.</p>
                <form id="importForm">
                    <div class="mb-3">
                        <label class="form-label">Jenis data</label>
                        <select class="form-select" id="importType" required>
                            <option value="mahasiswa">Mahasiswa</option>
                            <option value="dosen">Dosen</option>
                            <option value="matakuliah">Mata Kuliah</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">File CSV / Excel</label>
                        <input type="file" class="form-control" id="importFile" accept=".csv,.xlsx,.xls" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Upload dan Import</button>
                </form>
                <div id="importResult" class="mt-4"></div>
            </div>
        </div>
    `;

    document.getElementById('importForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const type = document.getElementById('importType').value;
        const fileInput = document.getElementById('importFile');
        const resultBox = document.getElementById('importResult');
        resultBox.innerHTML = '';

        if (!fileInput.files.length) {
            resultBox.innerHTML = '<div class="alert alert-warning">Pilih file CSV atau Excel terlebih dahulu.</div>';
            return;
        }

        try {
            const rows = await parseImportFile(fileInput.files[0]);
            if (!Array.isArray(rows) || rows.length === 0) {
                throw new Error('File tidak memiliki data atau header yang valid.');
            }

            const response = await fetch(`${API_ROOT}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, rows })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Import gagal.');
            }

            let details = `<div class="alert alert-success">${data.message}</div>`;
            if (data.result?.errors?.length) {
                details += '<div class="alert alert-warning"><strong>Baris gagal:</strong><ul>' +
                    data.result.errors.map(err => `<li>Baris ${err.row}: ${err.message}</li>`).join('') +
                    '</ul></div>';
            }
            resultBox.innerHTML = details;
        } catch (error) {
            resultBox.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    });
}

function renderProfile() {
    mainContent.innerHTML = `
        <div class="row gy-4">
            <div class="col-12 col-lg-6">
                <div class="card shadow-sm p-4">
                    <h5>Profile</h5>
                    <p><strong>Username:</strong> ${currentUser.username}</p>
                    <p><strong>Role:</strong> ${currentUser.role}</p>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <div class="card shadow-sm p-4">
                    <h5>Ubah Password</h5>
                    <form id="passwordForm">
                        <div class="mb-3">
                            <label class="form-label">Password Lama</label>
                            <input type="password" class="form-control" id="currentPassword" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password Baru</label>
                            <input type="password" class="form-control" id="newPassword" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Konfirmasi Password Baru</label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Simpan Password Baru</button>
                    </form>
                    <div id="passwordResult" class="mt-3"></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const resultBox = document.getElementById('passwordResult');

        if (newPassword !== confirmPassword) {
            resultBox.innerHTML = '<div class="alert alert-warning">Konfirmasi password tidak cocok.</div>';
            return;
        }

        try {
            const data = await fetchJson(`${API_ROOT}/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, current_password: currentPassword, new_password: newPassword })
            });
            resultBox.innerHTML = `<div class="alert alert-success">${data.success ? 'Password berhasil diubah.' : 'Gagal mengubah password.'}</div>`;
            document.getElementById('passwordForm').reset();
        } catch (error) {
            resultBox.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    });
}

function openMahasiswaModal(id = null) {
    entityModalTitle.textContent = id ? 'Edit Mahasiswa' : 'Tambah Mahasiswa';
    entityModalBody.innerHTML = `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">NIM</label>
                <input type="text" class="form-control" id="entityNim" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nama</label>
                <input type="text" class="form-control" id="entityNama" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Jurusan</label>
                <input type="text" class="form-control" id="entityJurusan">
            </div>
            <div class="mb-3">
                <label class="form-label">Angkatan</label>
                <input type="number" class="form-control" id="entityAngkatan">
            </div>
        </form>
    `;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;

    if (id) {
        fetchJson(`${API_ROOT}/mahasiswa?id=${id}`)
            .then(data => {
                document.getElementById('entityNim').value = data.nim || '';
                document.getElementById('entityNama').value = data.nama || '';
                document.getElementById('entityJurusan').value = data.jurusan || '';
                document.getElementById('entityAngkatan').value = data.angkatan || '';
            })
            .catch(() => showAlert('Tidak dapat memuat data mahasiswa.'));
    }

    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = () => saveMahasiswa(id);
}

function openDosenModal(id = null) {
    entityModalTitle.textContent = id ? 'Edit Dosen' : 'Tambah Dosen';
    entityModalBody.innerHTML = `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">NIP</label>
                <input type="text" class="form-control" id="entityNip" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nama</label>
                <input type="text" class="form-control" id="entityNama" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Jurusan</label>
                <input type="text" class="form-control" id="entityJurusan">
            </div>
        </form>
    `;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;

    if (id) {
        fetchJson(`${API_ROOT}/dosen?id=${id}`)
            .then(data => {
                document.getElementById('entityNip').value = data.nip || '';
                document.getElementById('entityNama').value = data.nama || '';
                document.getElementById('entityJurusan').value = data.jurusan || '';
            })
            .catch(() => showAlert('Tidak dapat memuat data dosen.'));
    }

    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = () => saveDosen(id);
}

function openMatakuliahModal(id = null) {
    entityModalTitle.textContent = id ? 'Edit Matakuliah' : 'Tambah Matakuliah';
    entityModalBody.innerHTML = `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">Kode MK</label>
                <input type="text" class="form-control" id="entityKode" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nama Matakuliah</label>
                <input type="text" class="form-control" id="entityNama" required>
            </div>
            <div class="mb-3">
                <label class="form-label">SKS</label>
                <input type="number" class="form-control" id="entitySks" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Dosen</label>
                <select class="form-select" id="entityDosen"></select>
            </div>
        </form>
    `;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;

    fetchJson(`${API_ROOT}/dosen`).then(dosen => {
        const select = document.getElementById('entityDosen');
        select.innerHTML = '<option value="">Pilih dosen (opsional)</option>' + dosen.map(item => `<option value="${item.id}">${item.nama} (${item.nip})</option>`).join('');
        if (id) {
            fetchJson(`${API_ROOT}/matakuliah?id=${id}`)
                .then(data => {
                    document.getElementById('entityKode').value = data.kode_mk || '';
                    document.getElementById('entityNama').value = data.nama_mk || '';
                    document.getElementById('entitySks').value = data.sks || '';
                    document.getElementById('entityDosen').value = data.dosen_id || '';
                })
                .catch(() => showAlert('Tidak dapat memuat data matakuliah.'));
        }
    }).catch(() => showAlert('Tidak dapat memuat daftar dosen.'));

    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = () => saveMatakuliah(id);
}

function openNilaiModal(id, nilai) {
    entityModalTitle.textContent = 'Edit Nilai';
    entityModalBody.innerHTML = `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">Nilai</label>
                <input type="text" class="form-control" id="entityNilai" value="${nilai}" required>
            </div>
        </form>
    `;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;
    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = () => saveNilai(id);
}

function openEnrollmentModal() {
    entityModalTitle.textContent = 'Tambah Enrollment';
    entityModalBody.innerHTML = `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">NIM Mahasiswa</label>
                <input type="text" class="form-control" id="entityNim" required>
            </div>
            <div class="mb-3">
                <label class="form-label">ID Mata Kuliah</label>
                <input type="number" class="form-control" id="entityMatkulId" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nilai</label>
                <input type="text" class="form-control" id="entityNilai">
            </div>
        </form>
    `;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;
    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = saveEnrollment;
}

async function saveMahasiswa(id) {
    const nim = document.getElementById('entityNim').value.trim();
    const nama = document.getElementById('entityNama').value.trim();
    const jurusan = document.getElementById('entityJurusan').value.trim();
    const angkatan = document.getElementById('entityAngkatan').value.trim();

    if (!nim || !nama) return;

    const body = { nim, nama, jurusan, angkatan };
    const url = id ? `${API_ROOT}/mahasiswa?id=${id}` : `${API_ROOT}/mahasiswa`;
    const method = id ? 'PUT' : 'POST';

    try {
        await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        entityModal.hide();
        renderMahasiswa();
    } catch (error) {
        showAlert(error.message);
    }
}

async function saveDosen(id) {
    const nip = document.getElementById('entityNip').value.trim();
    const nama = document.getElementById('entityNama').value.trim();
    const jurusan = document.getElementById('entityJurusan').value.trim();
    if (!nip || !nama) return;
    const body = { nip, nama, jurusan };
    const url = id ? `${API_ROOT}/dosen?id=${id}` : `${API_ROOT}/dosen`;
    const method = id ? 'PUT' : 'POST';
    try { await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); entityModal.hide(); renderDosen(); } catch (error) { showAlert(error.message); }
}

async function saveMatakuliah(id) {
    const kode = document.getElementById('entityKode').value.trim();
    const nama = document.getElementById('entityNama').value.trim();
    const sks = document.getElementById('entitySks').value.trim();
    const dosenId = document.getElementById('entityDosen').value;
    if (!kode || !nama || !sks) return;
    const body = { kode_mk: kode, nama_mk: nama, sks, dosen_id: dosenId || null };
    const url = id ? `${API_ROOT}/matakuliah?id=${id}` : `${API_ROOT}/matakuliah`;
    const method = id ? 'PUT' : 'POST';
    try { await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); entityModal.hide(); renderMatakuliah(); } catch (error) { showAlert(error.message); }
}

async function saveNilai(id) {
    const nilai = document.getElementById('entityNilai').value.trim();
    if (!nilai) return;
    try { await fetchJson(`${API_ROOT}/enrollment?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nilai }) }); entityModal.hide(); renderNilai(); } catch (error) { showAlert(error.message); }
}

async function saveEnrollment() {
    const nim = document.getElementById('entityNim').value.trim();
    const id_matkul = document.getElementById('entityMatkulId').value.trim();
    const nilai = document.getElementById('entityNilai').value.trim();
    if (!nim || !id_matkul) return;
    try {
        await fetchJson(`${API_ROOT}/enrollment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nim, id_matkul, nilai }) });
        entityModal.hide();
        renderEnrollment();
    } catch (error) {
        showAlert(error.message);
    }
}

async function deleteMahasiswa(id) {
    if (!confirm('Hapus mahasiswa ini?')) return;
    try { await fetchJson(`${API_ROOT}/mahasiswa?id=${id}`, { method: 'DELETE' }); renderMahasiswa(); } catch (error) { showAlert(error.message); }
}

async function deleteDosen(id) {
    if (!confirm('Hapus dosen ini?')) return;
    try { await fetchJson(`${API_ROOT}/dosen?id=${id}`, { method: 'DELETE' }); renderDosen(); } catch (error) { showAlert(error.message); }
}

async function deleteMatakuliah(id) {
    if (!confirm('Hapus matakuliah ini?')) return;
    try { await fetchJson(`${API_ROOT}/matakuliah?id=${id}`, { method: 'DELETE' }); renderMatakuliah(); } catch (error) { showAlert(error.message); }
}

async function deleteNilai(id) {
    if (!confirm('Hapus data nilai ini?')) return;
    try { await fetchJson(`${API_ROOT}/enrollment?id=${id}`, { method: 'DELETE' }); renderNilai(); } catch (error) { showAlert(error.message); }
}

async function loadEnrollmentData() {
    try {
        const data = await fetchJson(`${API_ROOT}/enrollment`);
        const tbody = document.getElementById('enrollmentBody');
        tbody.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Data enrollment kosong.</td></tr>';
            return;
        }
        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.id || '-'}</td>
                    <td>${item.nim || '-'}</td>
                    <td>${item.mahasiswa || '-'}</td>
                    <td>${item.nama_mk || '-'}</td>
                    <td>${item.dosen || '-'}</td>
                    <td>${item.nilai || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openNilaiModal(${item.id}, '${item.nilai || ''}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteNilai(${item.id})">Hapus</button>
                    </td>
                </tr>
            `;
        });
    } catch {
        showAlert('Gagal memuat data enrollment.');
    }
}

btnLogout.addEventListener('click', logout);

loadUserContext();