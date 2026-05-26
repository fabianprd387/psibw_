const API_ROOT = (() => {
    const path = window.location.pathname;
    if (path.includes('/public/') || path.endsWith('/login.html')) {
        return new URL('../api', window.location.href).pathname.replace(/\/$/, '');
    }
    return new URL('api', window.location.href).pathname.replace(/\/$/, '');
})();
const API_EXT = '.php';
function apiUrl(path) {
    return `${API_ROOT}/${path}${API_EXT}`;
}
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
        if (!response.ok) throw new Error(data?.error || 'Terjadi kesalahan API');
        return data;
    });
}

function openModal(title, formHtml, onSave) {
    entityModalTitle.textContent = title;
    entityModalBody.innerHTML = formHtml;
    entityModalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button type="button" class="btn btn-primary" id="saveEntityBtn">Simpan</button>
    `;
    entityModal.show();
    document.getElementById('saveEntityBtn').onclick = onSave;
}

async function deleteResource(id, path, callback, message = 'Hapus data ini?') {
    if (!confirm(message)) return;
    try {
        await fetchJson(`${apiUrl(path)}?id=${id}`, { method: 'DELETE' });
        callback();
    } catch (error) {
        showAlert(error.message);
    }
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
                if (!sheetName) throw new Error('File tidak memiliki sheet yang valid.');
                const sheet = workbook.Sheets[sheetName];
                resolve(XLSX.utils.sheet_to_json(sheet, { defval: '' }));
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
            { id: 'nilai', label: 'Nilai', icon: 'fa-graduation-cap' }
        ] : []),
        ...(role === 'dosen' ? [
            { id: 'mahasiswa', label: 'Mahasiswa', icon: 'fa-users' },
            { id: 'matakuliah', label: 'Daftar Matakuliah', icon: 'fa-calendar-alt' },
            { id: 'nilai', label: 'Nilai', icon: 'fa-pen' }
        ] : []),
        ...(role === 'tendik' ? [
            { id: 'mahasiswa', label: 'Mahasiswa', icon: 'fa-users' },
            { id: 'dosen', label: 'Dosen', icon: 'fa-chalkboard-teacher' },
            { id: 'matakuliah', label: 'Mata Kuliah', icon: 'fa-book' },
            { id: 'enrollment', label: 'Enrollment', icon: 'fa-clipboard-list' },
            { id: 'nilai', label: 'Nilai', icon: 'fa-graduation-cap' },
            { id: 'import', label: 'Import CSV', icon: 'fa-file-import' }
        ] : []),
        ...(role === 'dosen' ? [
            { id: 'import', label: 'Import CSV', icon: 'fa-file-import' }
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
    document.querySelectorAll('#mainMenu .nav-link').forEach(link => link.classList.toggle('active', link.dataset.section === section));
    if (renderers[section]) renderers[section]();
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
        const teacher = await fetchJson(`${apiUrl('dosen')}?nip=${encodeURIComponent(currentUser.username)}`).catch(() => null);
        currentTeacherId = teacher?.id || null;
    }

    setSection('dashboard');
}

function calculateAverage(values) {
    const numbers = values
        .map(value => Number(value))
        .filter(value => !Number.isNaN(value));
    if (!numbers.length) return null;
    return (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2);
}

const renderers = {
    dashboard: renderDashboard,
    mahasiswa: renderMahasiswa,
    dosen: renderDosen,
    matakuliah: renderMatakuliah,
    nilai: renderNilai,
    enrollment: renderEnrollment,
    import: renderImport,
    profile: renderProfile
};


function renderDashboard() {
    const role = currentUser.role;
    mainContent.innerHTML = `
        <div class="row gy-4">
            <div class="col-12">
                <div class="card shadow-sm p-4">
                    <div class="d-flex justify-content-between align-items-start gap-3 mb-4 flex-column flex-md-row">
                        <div>
                            <h3 class="mb-2">Dashboard ${role === 'mahasiswa' ? 'Mahasiswa' : role === 'dosen' ? 'Dosen' : 'Tendik'}</h3>
                            <p class="text-muted mb-0">Ringkasan aktivitas dan data penting untuk role <strong>${role}</strong>.</p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-primary text-uppercase">${role}</span>
                        </div>
                    </div>
                    <div class="row gy-4" id="dashboardCards">
                        <div class="col-12 text-center py-5 text-muted">Memuat data...</div>
                    </div>
                    <div class="mt-4" id="dashboardDetails"></div>
                </div>
            </div>
        </div>
    `;

    const cardsEl = document.getElementById('dashboardCards');
    const detailsEl = document.getElementById('dashboardDetails');

    if (role === 'mahasiswa') {
        fetchJson(`${apiUrl('enrollment')}?nim=${encodeURIComponent(currentUser.username)}`)
            .then(records => {
                const totalCourses = records.length;
                const average = calculateAverage(records.map(item => item.nilai));
                cardsEl.innerHTML = `
                    <div class="col-12 col-md-4">
                        <div class="card border-0 shadow-sm p-4 bg-light h-100">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <span class="text-secondary text-uppercase small">Mata Kuliah</span>
                                    <h3 class="mb-0">${totalCourses}</h3>
                                </div>
                                <i class="fas fa-book fa-2x text-primary"></i>
                            </div>
                            <p class="text-muted mb-0">Total mata kuliah yang diambil.</p>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="card border-0 shadow-sm p-4 bg-light h-100">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <span class="text-secondary text-uppercase small">Rata-rata</span>
                                    <h3 class="mb-0">${average ?? '-'}</h3>
                                </div>
                                <i class="fas fa-chart-line fa-2x text-success"></i>
                            </div>
                            <p class="text-muted mb-0">Nilai rata-rata dari mata kuliah.</p>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="card border-0 shadow-sm p-4 bg-light h-100">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <span class="text-secondary text-uppercase small">Terisi</span>
                                    <h3 class="mb-0">${records.filter(item => item.nilai).length}</h3>
                                </div>
                                <i class="fas fa-check-circle fa-2x text-info"></i>
                            </div>
                            <p class="text-muted mb-0">Jumlah nilai yang sudah tersedia.</p>
                        </div>
                    </div>
                `;

                if (!records.length) {
                    detailsEl.innerHTML = '<div class="alert alert-info">Belum ada data nilai. Silakan ajukan mata kuliah atau hubungi dosen untuk mendapatkan nilai.</div>';
                    return;
                }

                detailsEl.innerHTML = `
                    <div class="card border-0 shadow-sm p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0">Nilai Terbaru</h5>
                            <small class="text-muted">Ditampilkan 5 data terakhir</small>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle">
                                <thead class="table-light"><tr><th>Mata Kuliah</th><th>Dosen</th><th>Nilai</th></tr></thead>
                                <tbody>
                                    ${records.slice(0, 5).map(item => `
                                        <tr>
                                            <td>${item.nama_mk || '-'}</td>
                                            <td>${item.dosen || '-'}</td>
                                            <td>${item.nilai || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            })
            .catch(() => {
                cardsEl.innerHTML = `<div class="col-12 text-center text-danger">Tidak dapat memuat data nilai.</div>`;
                detailsEl.innerHTML = '';
            });
        return;
    }

    if (role === 'dosen') {
        if (!currentTeacherId) {
            cardsEl.innerHTML = `<div class="col-12"><div class="alert alert-warning">Akun dosen belum dikaitkan dengan data dosen.</div></div>`;
            detailsEl.innerHTML = '';
            return;
        }

        Promise.all([
            fetchJson(`${apiUrl('matakuliah')}`),
            fetchJson(`${apiUrl('enrollment')}?dosen_id=${currentTeacherId}`)
        ]).then(([courses, records]) => {
            const myCourses = Array.isArray(courses) ? courses.filter(course => course.dosen_id === currentTeacherId || String(course.dosen_id) === String(currentTeacherId)) : [];
            const totalCourses = myCourses.length;
            const totalStudents = new Set(records.map(item => item.nim)).size;
            const average = calculateAverage(records.map(item => item.nilai));

            cardsEl.innerHTML = `
                <div class="col-12 col-md-4">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Mata Kuliah</span>
                                <h3 class="mb-0">${totalCourses}</h3>
                            </div>
                            <i class="fas fa-chalkboard-teacher fa-2x text-primary"></i>
                        </div>
                        <p class="text-muted mb-0">Jumlah mata kuliah yang Anda ampu.</p>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Mahasiswa</span>
                                <h3 class="mb-0">${totalStudents}</h3>
                            </div>
                            <i class="fas fa-user-graduate fa-2x text-success"></i>
                        </div>
                        <p class="text-muted mb-0">Mahasiswa terdaftar pada mata kuliah Anda.</p>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Rata-rata</span>
                                <h3 class="mb-0">${average ?? '-'}</h3>
                            </div>
                            <i class="fas fa-percent fa-2x text-info"></i>
                        </div>
                        <p class="text-muted mb-0">Rata-rata nilai di kelas yang Anda ampu.</p>
                    </div>
                </div>
            `;

            if (!records.length) {
                detailsEl.innerHTML = '<div class="alert alert-info">Belum ada nilai untuk mata kuliah Anda.</div>';
                return;
            }

            detailsEl.innerHTML = `
                <div class="row gy-3">
                    <div class="col-12 col-lg-6">
                        <div class="card border-0 shadow-sm p-4 h-100">
                            <h5 class="mb-3">Mata Kuliah Utama</h5>
                            <ul class="list-group list-group-flush">
                                ${myCourses.slice(0, 5).map(course => `<li class="list-group-item px-0 py-2">${course.kode_mk} - ${course.nama_mk}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="col-12 col-lg-6">
                        <div class="card border-0 shadow-sm p-4 h-100">
                            <h5 class="mb-3">Nilai Terbaru</h5>
                            <div class="table-responsive">
                                <table class="table table-sm table-hover align-middle">
                                    <thead class="table-light"><tr><th>Mahasiswa</th><th>Mata Kuliah</th><th>Nilai</th></tr></thead>
                                    <tbody>
                                        ${records.slice(0, 5).map(item => `
                                            <tr>
                                                <td>${item.mahasiswa || '-'}</td>
                                                <td>${item.nama_mk || '-'}</td>
                                                <td>${item.nilai || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).catch(() => {
            cardsEl.innerHTML = `<div class="col-12 text-center text-danger">Tidak dapat memuat data untuk dosen.</div>`;
            detailsEl.innerHTML = '';
        });
        return;
    }

    fetchJson(`${apiUrl('laporan')}`)
        .then(data => {
            cardsEl.innerHTML = `
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Mahasiswa</span>
                                <h3 class="mb-0">${data.total_mahasiswa || 0}</h3>
                            </div>
                            <i class="fas fa-users fa-2x text-primary"></i>
                        </div>
                        <p class="text-muted mb-0">Jumlah mahasiswa terdaftar.</p>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Dosen</span>
                                <h3 class="mb-0">${data.total_dosen || 0}</h3>
                            </div>
                            <i class="fas fa-chalkboard-teacher fa-2x text-success"></i>
                        </div>
                        <p class="text-muted mb-0">Jumlah dosen aktif.</p>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Mata Kuliah</span>
                                <h3 class="mb-0">${data.total_matakuliah || 0}</h3>
                            </div>
                            <i class="fas fa-book fa-2x text-info"></i>
                        </div>
                        <p class="text-muted mb-0">Jumlah mata kuliah tersedia.</p>
                    </div>
                </div>
                <div class="col-12 col-md-3">
                    <div class="card border-0 shadow-sm p-4 bg-light h-100">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <span class="text-secondary text-uppercase small">Enrollment</span>
                                <h3 class="mb-0">${data.total_nilai || 0}</h3>
                            </div>
                            <i class="fas fa-clipboard-list fa-2x text-warning"></i>
                        </div>
                        <p class="text-muted mb-0">Jumlah enrollment mata kuliah.</p>
                    </div>
                </div>
            `;

            detailsEl.innerHTML = `
                <div class="row gy-3">
                    <div class="col-12 col-lg-4">
                        <div class="card border-0 shadow-sm p-4 h-100">
                            <h6 class="text-uppercase text-secondary mb-3">Menu cepat</h6>
                            <button class="btn btn-primary w-100 mb-2" onclick="setSection('mahasiswa')"><i class="fas fa-users me-2"></i>Kelola Mahasiswa</button>
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="setSection('dosen')"><i class="fas fa-chalkboard-teacher me-2"></i>Kelola Dosen</button>
                            <button class="btn btn-outline-primary w-100" onclick="setSection('matakuliah')"><i class="fas fa-book me-2"></i>Kelola Matakuliah</button>
                        </div>
                    </div>
                    <div class="col-12 col-lg-8">
                        <div class="card border-0 shadow-sm p-4 h-100">
                            <h5 class="mb-3">Ringkasan Tendik</h5>
                            <p class="text-muted">Panel ini membantu tendik melihat statistik utama dan menjalankan tugas manajemen akademik dengan cepat.</p>
                            <div class="progress mb-3" style="height: 14px; border-radius: 12px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: 80%"></div>
                            </div>
                            <small class="text-muted">Tingkat pemanfaatan sistem: 80%.</small>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            cardsEl.innerHTML = `<div class="col-12 text-center text-danger">Tidak dapat memuat data.</div>`;
            detailsEl.innerHTML = '';
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

    fetchJson(`${apiUrl('mahasiswa')}`)
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

    fetchJson(`${apiUrl('dosen')}`)
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

    Promise.all([fetchJson(`${apiUrl('matakuliah')}`), fetchJson(`${apiUrl('dosen')}`)]).then(([courses, dosen]) => {
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

    let url = `${apiUrl('enrollment')}`;
    if (isMahasiswa) {
        url += `?nim=${encodeURIComponent(currentUser.username)}`;
    } else if (isDosen) {
        if (!currentTeacherId) {
            showAlert('Tidak dapat memuat data. Data dosen tidak ditemukan.');
            return;
        }
        url += `?dosen_id=${currentTeacherId}`;
    }

    fetchJson(url)
        .then(data => {
            const tbody = document.getElementById('nilaiBody');
            tbody.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${isDosen ? 6 : 5}" class="text-center">Data nilai kosong.</td></tr>`;
                return;
            }
            data.forEach(item => {
                const actionCell = isDosen ? `
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openNilaiModal(${item.id}, '${item.nilai || ''}')">Edit</button>
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
    const isTendik = currentUser.role === 'tendik';
    const isDosen = currentUser.role === 'dosen';
    if (!isTendik && !isDosen) {
        showAlert('Akses hanya untuk tendik dan dosen.');
        return;
    }

    const description = isTendik
        ? 'Upload file CSV, XLSX, atau XLS untuk menambahkan data mahasiswa, dosen, matakuliah, atau enrollment.'
        : 'Upload file CSV, XLSX, atau XLS untuk memasukkan nilai mahasiswa.';
    const options = isTendik
        ? `
                            <option value="mahasiswa">Mahasiswa</option>
                            <option value="dosen">Dosen</option>
                            <option value="matakuliah">Mata Kuliah</option>
                            <option value="enrollment">Enrollment</option>
                        `
        : `
                            <option value="nilai">Nilai</option>
                        `;

    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header">
                <h5 class="mb-0">Import CSV / Excel</h5>
            </div>
            <div class="card-body">
                <p class="text-muted">${description}</p>
                <form id="importForm">
                    <div class="mb-3">
                        <label class="form-label">Jenis data</label>
                        <select class="form-select" id="importType" required>${options}</select>
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

            const response = await fetch(`${apiUrl('import')}`, {
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
            const data = await fetchJson(`${apiUrl('password')}`, {
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
    openModal(id ? 'Edit Mahasiswa' : 'Tambah Mahasiswa', `
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
    `, () => saveMahasiswa(id));

    if (!id) return;
    fetchJson(`${apiUrl('mahasiswa')}?id=${id}`)
        .then(data => {
            document.getElementById('entityNim').value = data.nim || '';
            document.getElementById('entityNama').value = data.nama || '';
            document.getElementById('entityJurusan').value = data.jurusan || '';
            document.getElementById('entityAngkatan').value = data.angkatan || '';
        })
        .catch(() => showAlert('Tidak dapat memuat data mahasiswa.'));
}

function openDosenModal(id = null) {
    openModal(id ? 'Edit Dosen' : 'Tambah Dosen', `
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
    `, () => saveDosen(id));

    if (!id) return;
    fetchJson(`${apiUrl('dosen')}?id=${id}`)
        .then(data => {
            document.getElementById('entityNip').value = data.nip || '';
            document.getElementById('entityNama').value = data.nama || '';
            document.getElementById('entityJurusan').value = data.jurusan || '';
        })
        .catch(() => showAlert('Tidak dapat memuat data dosen.'));
}

function openMatakuliahModal(id = null) {
    openModal(id ? 'Edit Matakuliah' : 'Tambah Matakuliah', `
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
    `, () => saveMatakuliah(id));

    fetchJson(`${apiUrl('dosen')}`).then(dosen => {
        const select = document.getElementById('entityDosen');
        select.innerHTML = '<option value="">Pilih dosen (opsional)</option>' + dosen.map(item => `<option value="${item.id}">${item.nama} (${item.nip})</option>`).join('');
        if (!id) return;
        fetchJson(`${apiUrl('matakuliah')}?id=${id}`)
            .then(data => {
                document.getElementById('entityKode').value = data.kode_mk || '';
                document.getElementById('entityNama').value = data.nama_mk || '';
                document.getElementById('entitySks').value = data.sks || '';
                document.getElementById('entityDosen').value = data.dosen_id || '';
            })
            .catch(() => showAlert('Tidak dapat memuat data matakuliah.'));
    }).catch(() => showAlert('Tidak dapat memuat daftar dosen.'));
}

function openNilaiModal(id, nilai) {
    openModal('Edit Nilai', `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">Nilai</label>
                <input type="text" class="form-control" id="entityNilai" value="${nilai}" required>
            </div>
        </form>
    `, () => saveNilai(id));
}

function openEnrollmentModal() {
    openModal('Tambah Enrollment', `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">NIM Mahasiswa</label>
                <input type="text" class="form-control" id="entityNim" required>
            </div>
            <div class="mb-3">
                <label class="form-label">ID Mata Kuliah</label>
                <input type="number" class="form-control" id="entityMatkulId" required>
            </div>
        </form>
    `, saveEnrollment);
}

async function saveMahasiswa(id) {
    const nim = document.getElementById('entityNim').value.trim();
    const nama = document.getElementById('entityNama').value.trim();
    const jurusan = document.getElementById('entityJurusan').value.trim();
    const angkatan = document.getElementById('entityAngkatan').value.trim();

    if (!nim || !nama) return;

    const body = { nim, nama, jurusan, angkatan };
    const url = id ? `${apiUrl('mahasiswa')}?id=${id}` : `${apiUrl('mahasiswa')}`;
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
    const url = id ? `${apiUrl('dosen')}?id=${id}` : `${apiUrl('dosen')}`;
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
    const url = id ? `${apiUrl('matakuliah')}?id=${id}` : `${apiUrl('matakuliah')}`;
    const method = id ? 'PUT' : 'POST';
    try { await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); entityModal.hide(); renderMatakuliah(); } catch (error) { showAlert(error.message); }
}

async function saveNilai(id) {
    const nilai = document.getElementById('entityNilai').value.trim();
    if (!nilai) return;
    try { await fetchJson(`${apiUrl('enrollment')}?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nilai }) }); entityModal.hide(); renderNilai(); } catch (error) { showAlert(error.message); }
}

async function saveEnrollment() {
    const nim = document.getElementById('entityNim').value.trim();
    const id_matkul = document.getElementById('entityMatkulId').value.trim();
    const nilaiEl = document.getElementById('entityNilai');
    const nilai = nilaiEl ? nilaiEl.value.trim() : null;
    if (!nim || !id_matkul) return;
    const body = nilai ? { nim, id_matkul, nilai } : { nim, id_matkul };
    try {
        await fetchJson(`${apiUrl('enrollment')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        entityModal.hide();
        renderEnrollment();
    } catch (error) {
        showAlert(error.message);
    }
}

async function deleteMahasiswa(id) {
    await deleteResource(id, 'mahasiswa', renderMahasiswa, 'Hapus mahasiswa ini?');
}

async function deleteDosen(id) {
    await deleteResource(id, 'dosen', renderDosen, 'Hapus dosen ini?');
}

async function deleteMatakuliah(id) {
    await deleteResource(id, 'matakuliah', renderMatakuliah, 'Hapus matakuliah ini?');
}

async function deleteNilai(id) {
    await deleteResource(id, 'enrollment', renderNilai, 'Hapus data nilai ini?');
}

async function loadEnrollmentData() {
    try {
        const data = await fetchJson(`${apiUrl('enrollment')}`);
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
                    <td>-</td>
                </tr>
            `;
        });
    } catch {
        showAlert('Gagal memuat data enrollment.');
    }
}

btnLogout.addEventListener('click', logout);

loadUserContext();