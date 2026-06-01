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
let currentPage = 1;
const rowsPerPage = 5;

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
    currentPage = 1;
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

    if (currentUser.photo_url) {
        userDisplay.innerHTML = `
            <img src="${currentUser.photo_url}" class="rounded-circle me-2" width="28" height="28" style="object-fit: cover;"> ${currentUser.username} (${currentUser.role})
        `;
    } else {
        userDisplay.textContent = `${currentUser.username} (${currentUser.role})`;
    }

    buildMenu();

    if (currentUser.role === 'dosen') {
        const teacher = await fetchJson(`${apiUrl('dosen')}?nip=${encodeURIComponent(currentUser.username)}`).catch(() => null);
        currentTeacherId = teacher?.id || null;
    }

    setSection('dashboard');
}
