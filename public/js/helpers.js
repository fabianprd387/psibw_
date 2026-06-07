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

function fetchJson(url, options = {}) {
    const currentUser = JSON.parse(localStorage.getItem('siakadUser') || 'null');
    if (!options.headers) {
        options.headers = {};
    }
    if (currentUser && currentUser.username) {
        options.headers['X-Username'] = currentUser.username;
    }
    return fetch(url, options).then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'Terjadi kesalahan API');
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

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Tidak dapat membaca file foto.'));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function showAlert(message, type = 'danger') {
    mainContent.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}
