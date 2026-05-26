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
            { id: 'matakuliah', label: 'Jadwal', icon: 'fa-calendar-alt' },
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

function calculateAverage(values) {
    const numbers = values.map(Number).filter(value => !Number.isNaN(value));
    if (!numbers.length) return null;
    return (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2);
}
