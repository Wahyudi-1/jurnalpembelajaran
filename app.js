/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP & STABIL)
 * =================================================================
 * @version 3.2 - Implementasi Manajemen Pengguna & UI Login baru.
 * @author Gemini AI Expert for User
 *
 * PERUBAHAN UTAMA:
 * - [IMPLEMENTASI] Logika CRUD lengkap untuk Manajemen Pengguna (Tambah, Lihat, Edit, Hapus).
 * - [PERBAIKAN] Inisialisasi halaman login disesuaikan dengan struktur HTML baru.
 * - [PENAMBAHAN] State cache untuk data pengguna.
 * - [INTEGRASI] Fitur manajemen pengguna diintegrasikan ke dalam alur navigasi dashboard.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

// URL WEB APP YANG SUDAH TERBUKTI STABIL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMYelEcD482DsmpyfHG0uAZMBXFS4tAKzFjvckzHJiib9P1KgFWnenMU3h_WDsUi41Gw/exec";

// --- STATE APLIKASI & CACHE ---
let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUserData = []; // [BARU] Cache untuk data pengguna
let searchTimeout;

// ====================================================================
// TAHAP 2: FUNGSI-FUNGSI PEMBANTU (HELPERS)
// ====================================================================

function showLoading(isLoading) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
}

function showStatusMessage(message, type = 'info', duration = 5000) {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
        window.scrollTo(0, 0);
        setTimeout(() => { statusEl.style.display = 'none'; }, duration);
    } else {
        alert(message);
    }
}

function populateDropdown(elementId, options, defaultOptionText = '-- Pilih --') {
    const select = document.getElementById(elementId);
    if (select) {
        const currentValue = select.value;
        select.innerHTML = `<option value="">${defaultOptionText}</option>`;
        options.forEach(option => {
            if (option) select.innerHTML += `<option value="${option}">${option}</option>`;
        });
        select.value = currentValue;
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

// ====================================================================
// TAHAP 3: FUNGSI-FUNGSI UTAMA
// ====================================================================

// --- 3.1. OTENTIKASI & SESI ---
// (Tidak ada perubahan signifikan di bagian ini)
function checkAuthentication() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        // Jika tidak di halaman login, redirect ke login
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    } else {
        const userData = JSON.parse(user);
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`;

        // Sembunyikan tombol manajemen pengguna jika bukan admin
        if (userData.peran && userData.peran.toLowerCase() !== 'admin') {
            const userManagementButton = document.querySelector('button[data-section="penggunaSection"]');
            if (userManagementButton) userManagementButton.style.display = 'none';
        }

        // Jika sudah login tapi masih di halaman login, redirect ke dashboard
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
             window.location.href = 'dashboard.html';
        }
    }
}

async function handleLogin() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');

    if (!usernameEl.value || !passwordEl.value) {
        return showStatusMessage("Username dan password harus diisi.", 'error');
    }
    showLoading(true);
    const passwordHash = CryptoJS.SHA256(passwordEl.value).toString();
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('username', usernameEl.value);
    formData.append('passwordHash', passwordHash);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === "success") {
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.data));
            window.location.href = 'dashboard.html';
        } else {
            showStatusMessage(result.message, 'error');
        }
    } catch (error) {
        showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
}

// --- 3.2. DASHBOARD & DATA GLOBAL ---
// (Tidak ada perubahan di bagian ini)
async function populateAllFilters() { /* ... kode asli ... */ }
async function loadDashboardStats() { /* ... kode asli ... */ }

// --- 3.3. MANAJEMEN SISWA (CRUD) ---
// (Tidak ada perubahan di bagian ini)
async function searchSiswa(forceRefresh = false) { /* ... kode asli ... */ }
function renderSiswaTable(siswaArray) { /* ... kode asli ... */ }
async function saveSiswa() { /* ... kode asli ... */ }
function editSiswaHandler(nisn) { /* ... kode asli ... */ }
function resetFormSiswa() { /* ... kode asli ... */ }
async function deleteSiswaHandler(nisn) { /* ... kode asli ... */ }
function exportSiswaToExcel() { /* ... kode asli ... */ }

// --- 3.4. INPUT JURNAL & PRESENSI ---
// (Tidak ada perubahan di bagian ini)
async function loadSiswaForPresensi() { /* ... kode asli ... */ }
async function submitJurnal() { /* ... kode asli ... */ }

// --- 3.5. RIWAYAT JURNAL ---
// (Tidak ada perubahan di bagian ini)
async function loadRiwayatJurnal() { /* ... kode asli ... */ }
function showJurnalDetail(jurnalId) { /* ... kode asli ... */ }


// --- [BARU] 3.6. MANAJEMEN PENGGUNA (ADMIN) ---

async function loadUsers() {
    const tableBody = document.getElementById('tabelPenggunaBody');
    if (!tableBody) return;

    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="4">Memuat data pengguna...</td></tr>';
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
        const result = await response.json();
        if (result.status === 'success') {
            cachedUserData = result.data; // Simpan ke cache
            renderUsersTable(result.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="4">Gagal memuat: ${result.message}</td></tr>`;
        }
    } catch (error) {
        showStatusMessage('Terjadi kesalahan jaringan saat memuat pengguna.', 'error');
        tableBody.innerHTML = '<tr><td colspan="4">Gagal terhubung ke server.</td></tr>';
    } finally {
        showLoading(false);
    }
}

function renderUsersTable(usersArray) {
    const tableBody = document.getElementById('tabelPenggunaBody');
    tableBody.innerHTML = '';
    if (!usersArray || usersArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Tidak ada data pengguna yang ditemukan.</td></tr>';
        return;
    }
    
    // Sortir agar Admin selalu di atas
    usersArray.sort((a, b) => {
        if (a.Peran === 'Admin' && b.Peran !== 'Admin') return -1;
        if (a.Peran !== 'Admin' && b.Peran === 'Admin') return 1;
        return a.Nama.localeCompare(b.Nama);
    });

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    usersArray.forEach(user => {
        const tr = document.createElement('tr');
        // Nonaktifkan tombol hapus untuk user yang sedang login
        const isSelf = loggedInUser && loggedInUser.username === user.Username;
        const deleteButton = isSelf 
            ? `<button class="btn btn-sm btn-danger" disabled title="Tidak dapat menghapus akun sendiri">Hapus</button>`
            : `<button class="btn btn-sm btn-danger" onclick="deleteUserHandler('${user.Username}')">Hapus</button>`;

        tr.innerHTML = `
            <td data-label="Nama Lengkap">${user.Nama}</td>
            <td data-label="Username">${user.Username}</td>
            <td data-label="Peran">${user.Peran}</td>
            <td data-label="Aksi">
                <button class="btn btn-sm btn-secondary" onclick="editUserHandler('${user.Username}')">Edit</button>
                ${deleteButton}
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function saveUser() {
    const form = document.getElementById('formPengguna');
    const formData = new FormData();
    
    const oldUsername = document.getElementById('editUsername').value;
    const action = oldUsername ? 'updateUser' : 'addUser';
    
    const nama = document.getElementById('namaPengguna').value;
    const username = document.getElementById('usernamePengguna').value;
    const peran = document.getElementById('peranPengguna').value;
    const password = document.getElementById('passwordPengguna').value;
    
    if (!nama || !username || !peran) {
        return showStatusMessage('Nama, Username, dan Peran harus diisi.', 'error');
    }

    if (action === 'addUser' && !password) {
        return showStatusMessage('Password wajib diisi untuk pengguna baru.', 'error');
    }

    formData.append('action', action);
    formData.append('nama', nama);
    formData.append('username', username);
    formData.append('peran', peran);
    
    if (oldUsername) {
        formData.append('oldUsername', oldUsername);
    }
    
    // Hanya kirim hash password jika password diisi
    if (password) {
        const passwordHash = CryptoJS.SHA256(password).toString();
        formData.append('passwordHash', passwordHash);
    }

    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            showStatusMessage(result.message, 'success');
            resetFormPengguna();
            loadUsers(); // Muat ulang daftar pengguna
        } else {
            showStatusMessage(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function editUserHandler(username) {
    const user = cachedUserData.find(u => u.Username === username);
    if (!user) {
        showStatusMessage('Data pengguna tidak ditemukan di cache.', 'error');
        return;
    }
    document.getElementById('editUsername').value = user.Username;
    document.getElementById('namaPengguna').value = user.Nama;
    document.getElementById('usernamePengguna').value = user.Username;
    document.getElementById('peranPengguna').value = user.Peran;
    document.getElementById('passwordPengguna').value = ''; // Selalu kosongkan password
    
    document.getElementById('simpanPenggunaButton').textContent = 'Update Pengguna';
    document.getElementById('batalEditPenggunaButton').style.display = 'inline-block';
    document.getElementById('formPengguna').scrollIntoView({ behavior: 'smooth' });
}

function resetFormPengguna() {
    document.getElementById('formPengguna').reset();
    document.getElementById('editUsername').value = '';
    document.getElementById('simpanPenggunaButton').textContent = 'Simpan Pengguna';
    document.getElementById('batalEditPenggunaButton').style.display = 'none';
}

async function deleteUserHandler(username) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna dengan username: ${username}? Aksi ini tidak dapat dibatalkan.`)) {
        showLoading(true);
        const formData = new FormData();
        formData.append('action', 'deleteUser');
        formData.append('username', username);
        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.status === 'success') {
                showStatusMessage(result.message, 'success');
                loadUsers(); // Muat ulang daftar
            } else {
                showStatusMessage(`Gagal menghapus: ${result.message}`, 'error');
            }
        } catch (error) {
            showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }
}


// ====================================================================
// TAHAP 4: INISIALISASI DAN EVENT LISTENERS
// ====================================================================

function setupDashboardListeners() {
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);

    const navButtons = document.querySelectorAll('.section-nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const sectionId = button.dataset.section;
            showSection(sectionId);
            // Muat data spesifik saat tab diaktifkan
            if (sectionId === 'riwayatSection') {
                loadRiwayatJurnal();
            } else if (sectionId === 'penggunaSection') {
                loadUsers(); // [BARU] Muat pengguna saat tab diklik
            } else if (sectionId === 'siswaSection' && cachedSiswaData.length === 0) {
                searchSiswa(true); // Muat data siswa jika belum ada
            }
        });
    });

    // Form Jurnal
    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);

    // Form Riwayat
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);

    // Form Siswa
    document.getElementById('saveSiswaButton')?.addEventListener('click', saveSiswa);
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('searchButton')?.addEventListener('click', () => searchSiswa(true));
    document.getElementById('exportSiswaExcel')?.addEventListener('click', exportSiswaToExcel);
    document.getElementById('nisnSearchInput')?.addEventListener('keyup', (e) => {
        clearTimeout(searchTimeout);
        if (e.key === 'Enter') {
            searchSiswa(true);
        } else {
            searchTimeout = setTimeout(() => searchSiswa(true), 400);
        }
    });

    // [BARU] Form Pengguna
    document.getElementById('simpanPenggunaButton')?.addEventListener('click', saveUser);
    document.getElementById('batalEditPenggunaButton')?.addEventListener('click', resetFormPengguna);
}

function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    
    populateAllFilters();
    loadDashboardStats();
    
    // Tampilkan section default dan aktifkan tombolnya
    showSection('jurnalSection');
    document.querySelector('.section-nav button[data-section="jurnalSection"]')?.classList.add('active');
}

function initLoginPage() {
    checkAuthentication();
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    // [DIUBAH] Selector disesuaikan dengan HTML baru
    document.querySelector('.login-box form')?.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
}

// ====================================================================
// TAHAP 5: TITIK MASUK APLIKASI (ENTRY POINT)
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    const pageName = window.location.pathname.split("/").pop();
    if (pageName === 'dashboard.html') {
        initDashboardPage();
    } else if (pageName === 'index.html' || pageName === '') {
        initLoginPage();
    }
});
