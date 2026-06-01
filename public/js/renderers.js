function calculateAverage(values) {
    const gradeWeights = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0
    };

    const validGrades = values.filter(val => val in gradeWeights);
    if (validGrades.length === 0) return null;

    const total = validGrades.reduce((sum, val) => sum + gradeWeights[val], 0);
    const avg = total / validGrades.length;

    let closestLetter = 'E';
    let minDiff = Infinity;
    for (const [letter, weight] of Object.entries(gradeWeights)) {
        const diff = Math.abs(avg - weight);
        if (diff < minDiff) {
            minDiff = diff;
            closestLetter = letter;
        }
    }

    return `${avg.toFixed(2)} (${closestLetter})`;
}

function renderPaginationControl(totalItems, targetAction) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (totalPages <= 1) return '';

    let itemsHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        itemsHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ${targetAction}(${i})">${i}</a>
            </li>
        `;
    }

    return `
        <nav class="mt-3">
            <ul class="pagination pagination-sm justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); ${targetAction}(${currentPage - 1})">Previous</a>
                </li>
                ${itemsHtml}
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); ${targetAction}(${currentPage + 1})">Next</a>
                </li>
            </ul>
        </nav>
    `;
}

function paginateData(data, page) {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
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

function renderMahasiswa(page = 1) {
    currentPage = page;
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
                <div id="mahasiswaPagination"></div>
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
            const paginated = paginateData(data, currentPage);
            paginated.forEach(item => {
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
            document.getElementById('mahasiswaPagination').innerHTML = renderPaginationControl(data.length, 'renderMahasiswa');
            if (canEdit) document.getElementById('addMahasiswaBtn').addEventListener('click', () => openMahasiswaModal());
        })
        .catch(() => showAlert('Gagal memuat data mahasiswa.'));
}

function renderDosen(page = 1) {
    currentPage = page;
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
                <div id="dosenPagination"></div>
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
            const paginated = paginateData(data, currentPage);
            paginated.forEach(item => {
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
            document.getElementById('dosenPagination').innerHTML = renderPaginationControl(data.length, 'renderDosen');
            if (canEdit) document.getElementById('addDosenBtn').addEventListener('click', () => openDosenModal());
        })
        .catch(() => showAlert('Gagal memuat data dosen.'));
}

function renderMatakuliah(page = 1) {
    currentPage = page;
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
                        <thead class="table-light"><tr><th>Kode MK</th><th>Nama</th><th>SKS</th><th>Semester</th><th>Dosen</th>${canEdit ? '<th>Aksi</th>' : ''}</tr></thead>
                        <tbody id="matakuliahBody"><tr><td colspan="${canEdit ? 6 : 5}" class="text-center">Memuat data...</td></tr></tbody>
                    </table>
                </div>
                <div id="matakuliahPagination"></div>
            </div>
        </div>
    `;

    Promise.all([fetchJson(`${apiUrl('matakuliah')}`), fetchJson(`${apiUrl('dosen')}`)]).then(([courses, dosen]) => {
        const tbody = document.getElementById('matakuliahBody');
        tbody.innerHTML = '';
        if (!Array.isArray(courses) || courses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${canEdit ? 6 : 5}" class="text-center">Data matakuliah kosong.</td></tr>`;
            return;
        }
        const paginated = paginateData(courses, currentPage);
        paginated.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.kode_mk || '-'}</td>
                    <td>${item.nama_mk || '-'}</td>
                    <td>${item.sks || '-'}</td>
                    <td>${item.semester || '-'}</td>
                    <td>${item.dosen || '-'}</td>
                    ${canEdit ? `<td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openMatakuliahModal(${item.id})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMatakuliah(${item.id})">Hapus</button>
                    </td>` : ''}
                </tr>
            `;
        });
        document.getElementById('matakuliahPagination').innerHTML = renderPaginationControl(courses.length, 'renderMatakuliah');
        if (canEdit) document.getElementById('addMatakuliahBtn').addEventListener('click', () => openMatakuliahModal());
    }).catch(() => showAlert('Gagal memuat data matakuliah.'));
}

function renderNilai(page = 1) {
    currentPage = page;
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
                <div id="nilaiPagination"></div>
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
                tbody.innerHTML = `<tr><td colspan="${isDosen || isTendik ? 6 : 5}" class="text-center">Data nilai kosong.</td></tr>`;
                return;
            }
            const paginated = paginateData(data, currentPage);
            paginated.forEach(item => {
                const actionCell = isDosen ? `
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openNilaiModal(${item.id}, '${item.nilai || ''}')">Edit</button>
                    </td>` : isTendik ? `<td>-</td>` : '';

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
            document.getElementById('nilaiPagination').innerHTML = renderPaginationControl(data.length, 'renderNilai');
        })
        .catch(() => showAlert('Gagal memuat data nilai.'));
}

function renderEnrollment(page = 1) {
    if (currentUser.role !== 'tendik') {
        showAlert('Akses hanya untuk tendik.');
        return;
    }
    currentPage = page;
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
                <div id="enrollmentPagination"></div>
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

async function renderProfile() {
    mainContent.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
    try {
        const profile = await fetchJson(`${apiUrl('profile')}?nim=${encodeURIComponent(currentUser.username)}`);
        const initials = (profile.name || profile.username || '').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
        const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='104' height='104'%3E%3Crect width='100%25' height='100%25' fill='%230d6efd'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ffffff'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
        const avatarUrl = profile.photo_url || defaultAvatar;
        const showJurusan = profile.role === 'mahasiswa' || profile.role === 'dosen';

        const roleDescription = profile.role === 'mahasiswa'
            ? 'Profil Mahasiswa aktif di Sistem Informasi Akademik.'
            : profile.role === 'dosen'
                ? 'Profil Dosen dengan informasi jurusan dan identitas.'
                : 'Profil Tenaga Kependidikan dan jabatan administratif.';

        mainContent.innerHTML = `
            <div class="row gy-4">
                <div class="col-12 col-xl-7">
                    <div class="card shadow-sm p-4 profile-card">
                        <div class="profile-hero">
                            <div class="profile-avatar">
                                <img src="${avatarUrl}" alt="Foto Profil">
                            </div>
                            <div class="profile-meta">
                                <h2>${profile.name || profile.username}</h2>
                                <span class="profile-role-badge">${profile.role}</span>
                                <p class="profile-description mb-2">${roleDescription}</p>
                                <p class="text-muted mb-0">${profile.label_id}: ${profile.id_value}</p>
                            </div>
                        </div>
                        <div class="profile-summary-grid">
                            <div class="profile-summary-card">
                                <dt>Username</dt>
                                <dd>${profile.username}</dd>
                            </div>
                            <div class="profile-summary-card">
                                <dt>${profile.label_id}</dt>
                                <dd>${profile.id_value}</dd>
                            </div>
                            ${showJurusan ? `
                                <div class="profile-summary-card">
                                    <dt>Jurusan</dt>
                                    <dd>${profile.jurusan || '-'}</dd>
                                </div>
                            ` : ''}
                            ${profile.role === 'mahasiswa' ? `
                                <div class="profile-summary-card">
                                    <dt>Angkatan</dt>
                                    <dd>${profile.angkatan || '-'}</dd>
                                </div>
                            ` : ''}
                            ${profile.role === 'tendik' ? `
                                <div class="profile-summary-card">
                                    <dt>Jabatan</dt>
                                    <dd>${profile.jabatan || '-'}</dd>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-12 col-xl-5">
                    <div class="card shadow-sm p-4">
                        <h5 class="mb-3">Perbarui Profil</h5>
                        <form id="profileForm">
                            <div class="mb-3 text-center">
                                <img src="${avatarUrl}" id="profilePreview" class="rounded-circle mb-3" width="104" height="104" style="object-fit: cover; display: inline-block;">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ubah Foto Profil</label>
                                <input type="file" accept="image/png, image/jpeg" class="form-control" id="profilePhoto">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nama Lengkap</label>
                                <input type="text" class="form-control" id="profileName" value="${profile.name || ''}" required>
                            </div>
                            ${profile.role === 'mahasiswa' ? `
                                <div class="mb-3">
                                    <label class="form-label">Jurusan</label>
                                    <input type="text" class="form-control" id="profileJurusan" value="${profile.jurusan || ''}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Angkatan</label>
                                    <input type="number" class="form-control" id="profileAngkatan" value="${profile.angkatan || ''}">
                                </div>
                            ` : ''}
                            ${profile.role === 'dosen' ? `
                                <div class="mb-3">
                                    <label class="form-label">Jurusan</label>
                                    <input type="text" class="form-control" id="profileJurusan" value="${profile.jurusan || ''}">
                                </div>
                            ` : ''}
                            ${profile.role === 'tendik' ? `
                                <div class="mb-3">
                                    <label class="form-label">Jabatan</label>
                                    <input type="text" class="form-control" id="profileJabatan" value="${profile.jabatan || ''}">
                                </div>
                            ` : ''}
                            <button type="submit" class="btn btn-primary w-100">Simpan Perubahan</button>
                        </form>
                        <div id="profileResult" class="mt-3"></div>
                    </div>
                </div>
                <div class="col-12">
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

        const profilePhotoInput = document.getElementById('profilePhoto');
        const profilePreview = document.getElementById('profilePreview');
        profilePhotoInput.addEventListener('change', () => {
            const file = profilePhotoInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { profilePreview.src = reader.result; };
            reader.readAsDataURL(file);
        });

        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const resultBox = document.getElementById('profileResult');
            resultBox.innerHTML = '';

            const name = document.getElementById('profileName').value.trim();
            const body = { name };
            if (profile.role === 'mahasiswa') {
                body.jurusan = document.getElementById('profileJurusan').value.trim();
                body.angkatan = document.getElementById('profileAngkatan').value.trim();
            }
            if (profile.role === 'dosen') {
                body.jurusan = document.getElementById('profileJurusan').value.trim();
            }
            if (profile.role === 'tendik') {
                body.jabatan = document.getElementById('profileJabatan').value.trim();
            }
            if (profilePhotoInput.files.length) {
                try { body.photo_data = await readFileAsDataURL(profilePhotoInput.files[0]); } catch (error) {
                    resultBox.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
                    return;
                }
            }

            try {
                const data = await fetchJson(`${apiUrl('profile')}?nim=${encodeURIComponent(currentUser.username)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                resultBox.innerHTML = '<div class="alert alert-success">Profil berhasil diperbarui.</div>';
                currentUser = { ...currentUser, photo_url: data.profile.photo_url };
                localStorage.setItem('siakadUser', JSON.stringify(currentUser));
                if (currentUser.photo_url) {
                    userDisplay.innerHTML = `
                        <img src="${currentUser.photo_url}" class="rounded-circle me-2" width="28" height="28" style="object-fit: cover;"> ${currentUser.username} (${currentUser.role})
                    `;
                }
                setSection(currentSection);
            } catch (error) {
                resultBox.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });

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
    } catch (error) {
        showAlert(error.message);
    }
}
