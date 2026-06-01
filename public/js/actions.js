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
                <label class="form-label">Semester</label>
                <input type="number" class="form-control" id="entitySemester">
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
                document.getElementById('entitySemester').value = data.semester || '';
                document.getElementById('entityDosen').value = data.dosen_id || '';
            })
            .catch(() => showAlert('Tidak dapat memuat data matakuliah.'));
    }).catch(() => showAlert('Tidak dapat memuat daftar dosen.'));
}

function openNilaiModal(id, nilai) {
    const options = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'];
    const optionsHtml = options.map(opt => `<option value="${opt}" ${nilai === opt ? 'selected' : ''}>${opt}</option>`).join('');

    openModal('Edit Nilai', `
        <form id="entityForm">
            <div class="mb-3">
                <label class="form-label">Nilai</label>
                <select class="form-select" id="entityNilai" required>
                    <option value="">Pilih Nilai</option>
                    ${optionsHtml}
                </select>
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
        renderMahasiswa(currentPage);
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
    try {
        await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        entityModal.hide();
        renderDosen(currentPage);
    } catch (error) {
        showAlert(error.message);
    }
}

async function saveMatakuliah(id) {
    const kode = document.getElementById('entityKode').value.trim();
    const nama = document.getElementById('entityNama').value.trim();
    const sks = document.getElementById('entitySks').value.trim();
    const semester = document.getElementById('entitySemester').value.trim();
    const dosenId = document.getElementById('entityDosen').value;
    if (!kode || !nama || !sks) return;
    const body = { kode_mk: kode, nama_mk: nama, sks, semester, dosen_id: dosenId || null };
    const url = id ? `${apiUrl('matakuliah')}?id=${id}` : `${apiUrl('matakuliah')}`;
    const method = id ? 'PUT' : 'POST';
    try {
        await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        entityModal.hide();
        renderMatakuliah(currentPage);
    } catch (error) {
        showAlert(error.message);
    }
}

async function saveNilai(id) {
    const nilai = document.getElementById('entityNilai').value.trim();
    if (!nilai) return;
    try {
        await fetchJson(`${apiUrl('enrollment')}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nilai })
        });
        entityModal.hide();
        renderNilai(currentPage);
    } catch (error) {
        showAlert(error.message);
    }
}

async function saveEnrollment() {
    const nim = document.getElementById('entityNim').value.trim();
    const id_matkul = document.getElementById('entityMatkulId').value.trim();
    if (!nim || !id_matkul) return;
    try {
        await fetchJson(`${apiUrl('enrollment')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nim, id_matkul })
        });
        entityModal.hide();
        renderEnrollment(currentPage);
    } catch (error) {
        showAlert(error.message);
    }
}

async function deleteMahasiswa(id) {
    await deleteResource(id, 'mahasiswa', () => renderMahasiswa(currentPage), 'Hapus mahasiswa ini?');
}

async function deleteDosen(id) {
    await deleteResource(id, 'dosen', () => renderDosen(currentPage), 'Hapus dosen ini?');
}

async function deleteMatakuliah(id) {
    await deleteResource(id, 'matakuliah', () => renderMatakuliah(currentPage), 'Hapus matakuliah ini?');
}

async function deleteNilai(id) {
    await deleteResource(id, 'enrollment', () => renderNilai(currentPage), 'Hapus data nilai ini?');
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
        const paginated = paginateData(data, currentPage);
        paginated.forEach(item => {
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
        document.getElementById('enrollmentPagination').innerHTML = renderPaginationControl(data.length, 'renderEnrollment');
    } catch {
        showAlert('Gagal memuat data enrollment.');
    }
}
