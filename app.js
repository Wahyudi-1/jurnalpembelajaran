/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL ONLINE (VERSI 5.0 - FINAL)
 * =================================================================
 * @version 5.0 - Final, Clean Code, Caching, Synced with Backend v2.0
 * @author Gemini AI Expert for User
 *
 * FITUR & PERBAIKAN UTAMA:
 * - [UPDATE] Menggunakan URL Web App terbaru yang telah disediakan.
 * - [SINKRON] Semua request GET dan POST disesuaikan dengan router backend terbaru.
 * - [OPTIMASI] Client-side caching diimplementasikan untuk data statis (filter, siswa, pengguna).
 * - [UI/UX] Logika event listener dan pembaruan UI disempurnakan untuk pengalaman yang lebih mulus.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQIrQqmYCS6F4xJMJzYK9_rab1Ppi0GIdtBB_1CT_ZmgyoO41TiKA3lq0sdHAcIToXgg/exec";

// --- STATE APLIKASI & CACHE ---
let appCache = {
    filterOptions: null,
    allSiswa: null,
    allUsers: null
};
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
        (options || []).forEach(option => {
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

// --- 3.1 OTENTIKASI & SESI ---
function checkAuthentication() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    } else {
        const userData = JSON.parse(user);
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`;

        if (userData.peran?.toLowerCase() !== 'admin') {
            const userManagementButton = document.querySelector('button[data-section="penggunaSection"]');
            if (userManagementButton) userManagementButton.style.display = 'none';
        }
        
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

// --- 3.2 DATA GLOBAL & DASHBOARD (DENGAN CACHING) ---
async function populateAllFilters() {
    if (appCache.filterOptions) {
        const { tahunAjaran, kelas, mataPelajaran } = appCache.filterOptions;
        populateDropdown('filterTahunAjaran', tahunAjaran, '-- Pilih Tahun Ajaran --');
        populateDropdown('filterKelas', kelas, '-- Pilih Kelas --');
        populateDropdown('filterMataPelajaran', mataPelajaran, '-- Pilih Mapel --');
        populateDropdown('riwayatFilterKelas', kelas, '-- Semua Kelas --');
        populateDropdown('riwayatFilterMapel', mataPelajaran, '-- Semua Mapel --');
        return;
    }

    try {
        const response = await fetch(`${SCRIPT_URL}?getFilterOptions=true`);
        const result = await response.json();
        if (result.status === 'success') {
            appCache.filterOptions = result.data;
            populateAllFilters();
        }
    } catch (error) {
        console.error("Gagal memuat filter:", error);
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${SCRIPT_URL}?getDashboardStats=true`);
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni;
            document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran;
            document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas;
        }
    } catch (error) {
        console.error("Gagal memuat statistik:", error);
    }
}

// --- 3.3 MANAJEMEN SISWA (DENGAN CACHING & PENCARIAN) ---
async function loadAndCacheAllSiswa() {
    showLoading(true);
    try {
        const response = await fetch(`${SCRIPT_URL}?searchSiswa=true&searchTerm=`);
        const result = await response.json();
        if (result.status === 'success') {
            appCache.allSiswa = result.data;
        } else {
            document.getElementById('siswaResultsTableBody').innerHTML = `<tr><td colspan="5">Gagal memuat: ${result.message}</td></tr>`;
        }
    } catch (error) {
        showStatusMessage('Terjadi kesalahan jaringan saat memuat data siswa.', 'error');
    } finally {
        showLoading(false);
    }
}

function searchSiswa() {
    if (!appCache.allSiswa) {
        loadAndCacheAllSiswa().then(() => searchSiswa());
        return;
    }

    const searchTerm = document.getElementById('nisnSearchInput').value.toLowerCase();
    const filteredData = searchTerm
        ? appCache.allSiswa.filter(siswa => 
            String(siswa.NISN).includes(searchTerm) || 
            siswa.Nama.toLowerCase().includes(searchTerm)
          )
        : appCache.allSiswa;

    renderSiswaTable(filteredData);
}

function renderSiswaTable(siswaArray) {
    const tableBody = document.getElementById('siswaResultsTableBody');
    tableBody.innerHTML = '';
    if (siswaArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Tidak ada data siswa yang ditemukan.</td></tr>';
        return;
    }
    siswaArray.forEach(siswa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="NISN">${siswa.NISN}</td>
            <td data-label="Nama">${siswa.Nama}</td>
            <td data-label="Kelas">${siswa.Kelas || ''}</td>
            <td data-label="Tahun Ajaran">${siswa.TahunAjaran || ''}</td>
            <td data-label="Aksi">
                <button class="btn btn-sm btn-secondary" onclick="editSiswaHandler('${siswa.NISN}')">Ubah</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSiswaHandler('${siswa.NISN}')">Hapus</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function saveSiswa() {
    const formSiswa = document.getElementById('formSiswa');
    if (!formSiswa) return;
    const formData = new FormData(formSiswa);

    if (!formData.get('nisn') || !formData.get('nama')) {
        return showStatusMessage('Gagal: NISN dan Nama wajib diisi.', 'error');
    }

    const oldNisn = document.getElementById('formNisnOld').value;
    const action = oldNisn ? 'updateSiswa' : 'addSiswa';
    formData.append('action', action);
    if (oldNisn) formData.append('oldNisn', oldNisn);

    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            showStatusMessage(result.message, 'success');
            resetFormSiswa();
            appCache.allSiswa = null; // Hapus cache agar data baru di-load ulang
            searchSiswa();
        } else {
            showStatusMessage(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function editSiswaHandler(nisn) {
    const siswa = appCache.allSiswa.find(s => s.NISN == nisn);
    if (!siswa) return;
    document.getElementById('formNisn').value = siswa.NISN;
    document.getElementById('formNama').value = siswa.Nama;
    document.getElementById('formKelas').value = siswa.Kelas;
    document.getElementById('formTahunAjaran').value = siswa.TahunAjaran;
    document.getElementById('formMapel').value = siswa.MataPelajaran || '';
    document.getElementById('formNisnOld').value = siswa.NISN;
    document.getElementById('saveSiswaButton').textContent = 'Update Data Siswa';
    document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' });
}

function resetFormSiswa() {
    document.getElementById('formSiswa').reset();
    document.getElementById('formNisnOld').value = '';
    document.getElementById('saveSiswaButton').textContent = 'Simpan Data Siswa';
}

async function deleteSiswaHandler(nisn) {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa dengan NISN: ${nisn}?`)) {
        showLoading(true);
        const formData = new FormData();
        formData.append('action', 'deleteSiswa');
        formData.append('nisn', nisn);
        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.status === 'success') {
                showStatusMessage(result.message, 'success');
                appCache.allSiswa = null;
                searchSiswa();
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

// --- 3.4 INPUT JURNAL & PRESENSI ---
async function loadSiswaForPresensi() {
    const kelas = document.getElementById('filterKelas').value;
    const tahunAjaran = document.getElementById('filterTahunAjaran').value;
    const tableBody = document.getElementById('presensiTableBody');
    if (!kelas || !tahunAjaran) return showStatusMessage('Pilih Tahun Ajaran dan Kelas terlebih dahulu.', 'info');
    
    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="3">Memuat data siswa...</td></tr>';
    try {
        const response = await fetch(`${SCRIPT_URL}?getSiswaForPresensi=true&kelas=${kelas}&tahunAjaran=${tahunAjaran}`);
        const result = await response.json();
        tableBody.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(siswa => {
                const tr = document.createElement('tr');
                tr.dataset.nisn = siswa.NISN;
                tr.dataset.nama = siswa.Nama;
                tr.innerHTML = `<td data-label="NISN">${siswa.NISN}</td><td data-label="Nama">${siswa.Nama}</td><td data-label="Kehadiran"><select class="kehadiran-status" style="width:100%; padding: 0.5rem;"><option value="Hadir" selected>Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alfa">Alfa</option></select></td>`;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">Tidak ada siswa yang ditemukan untuk filter ini.</td></tr>';
        }
    } catch (error) {
        showStatusMessage('Gagal memuat siswa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function submitJurnal() {
    const detailJurnal = {
        tahunAjaran: document.getElementById('filterTahunAjaran').value,
        kelas: document.getElementById('filterKelas').value,
        mataPelajaran: document.getElementById('filterMataPelajaran').value,
        tanggal: document.getElementById('tanggalPembelajaran').value,
        periode: document.getElementById('periodePembelajaran').value,
        materi: document.getElementById('materiPembelajaran').value,
        catatan: document.getElementById('catatanPembelajaran').value,
    };
    for (const key in detailJurnal) {
        if (!detailJurnal[key] && !['catatan', 'periode'].includes(key)) return showStatusMessage(`Harap isi kolom "${key}"`, 'error');
    }

    const presensiRows = document.querySelectorAll('#presensiTableBody tr');
    if (presensiRows.length === 0 || presensiRows[0].cells.length < 3) return showStatusMessage('Harap muat data siswa untuk presensi terlebih dahulu.', 'error');
    
    const dataPresensi = Array.from(presensiRows).map(row => ({ nisn: row.dataset.nisn, nama: row.dataset.nama, status: row.querySelector('.kehadiran-status').value }));
    const jurnalData = { action: 'submitJurnal', payload: { detail: detailJurnal, presensi: dataPresensi } };
    
    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(jurnalData) });
        const result = await response.json();
        if (result.status === 'success') {
            showStatusMessage(result.message, 'success');
            document.getElementById('formJurnal').reset();
            document.getElementById('presensiTableBody').innerHTML = '';
        } else {
            showStatusMessage(`Gagal menyimpan jurnal: ${result.message}`, 'error');
        }
    } catch (error) {
        showStatusMessage('Terjadi kesalahan jaringan: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}


// --- 3.5 RIWAYAT JURNAL ---
async function loadRiwayatJurnal() {
    const kelas = document.getElementById('riwayatFilterKelas').value;
    const mapel = document.getElementById('riwayatFilterMapel').value;
    const container = document.getElementById('riwayatContainer');
    container.innerHTML = '<p>Memuat riwayat...</p>';
    showLoading(true);

    try {
        const response = await fetch(`${SCRIPT_URL}?getJurnalHistory=true&kelas=${kelas}&mapel=${mapel}`);
        const result = await response.json();
        container.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(jurnal => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<div class="card-header" style="padding-bottom: 0.5rem; margin-bottom: 0.5rem;">${jurnal.MataPelajaran} - ${jurnal.Kelas}</div><small style="color: var(--text-light);">${new Date(jurnal.Tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small><p style="margin-top: 10px; font-size: 0.9rem;"><strong>Materi:</strong> ${jurnal.Materi.substring(0, 100)}...</p><p style="font-size: 0.9rem;"><strong>Hadir:</strong> ${jurnal.presensi.filter(p => p.Status === 'Hadir').length}/${jurnal.presensi.length} siswa</p><button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="showJurnalDetail('${jurnal.ID}')">Lihat Detail</button>`;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Tidak ada riwayat jurnal ditemukan.</p>';
        }
    } catch(error) {
        showStatusMessage('Gagal memuat riwayat: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// --- 3.6 MANAJEMEN PENGGUNA (DENGAN CACHING) ---
async function loadUsers() {
    if (appCache.allUsers) {
        renderUsersTable(appCache.allUsers);
        return;
    }
    showLoading(true);
    const tableBody = document.getElementById('tabelPenggunaBody');
    tableBody.innerHTML = '<tr><td colspan="4">Memuat data pengguna...</td></tr>';
    try {
        const response = await fetch(`${SCRIPT_URL}?getUsers=true`);
        const result = await response.json();
        if (result.status === 'success') {
            appCache.allUsers = result.data;
            renderUsersTable(result.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="4">Gagal memuat: ${result.message}</td></tr>`;
        }
    } catch (error) {
        showStatusMessage('Terjadi kesalahan jaringan saat memuat pengguna.', 'error');
    } finally {
        showLoading(false);
    }
}

function renderUsersTable(usersArray) {
    const tableBody = document.getElementById('tabelPenggunaBody');
    tableBody.innerHTML = '';
    if (!usersArray || usersArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Tidak ada data pengguna.</td></tr>';
        return;
    }
    usersArray.sort((a, b) => a.Nama.localeCompare(b.Nama)).sort((a,b) => (a.Peran === 'Admin' ? -1 : 1));
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    usersArray.forEach(user => {
        const tr = document.createElement('tr');
        const isSelf = loggedInUser && loggedInUser.username === user.Username;
        const deleteButton = isSelf ? `<button class="btn btn-sm btn-danger" disabled>Hapus</button>` : `<button class="btn btn-sm btn-danger" onclick="deleteUserHandler('${user.Username}')">Hapus</button>`;
        tr.innerHTML = `<td data-label="Nama">${user.Nama}</td><td data-label="Username">${user.Username}</td><td data-label="Peran">${user.Peran}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="editUserHandler('${user.Username}')">Edit</button>${deleteButton}</td>`;
        tableBody.appendChild(tr);
    });
}

async function saveUser() {
    const formData = new FormData(document.getElementById('formPengguna'));
    const password = formData.get('passwordPengguna');
    const oldUsername = document.getElementById('editUsername').value;
    const action = oldUsername ? 'updateUser' : 'addUser';
    
    formData.append('action', action);
    if (oldUsername) formData.append('oldUsername', oldUsername);
    if (password) formData.append('passwordHash', CryptoJS.SHA256(password).toString());
    formData.delete('passwordPengguna'); // Hapus field asli agar tidak terkirim

    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            showStatusMessage(result.message, 'success');
            resetFormPengguna();
            appCache.allUsers = null;
            loadUsers();
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
    const user = appCache.allUsers.find(u => u.Username === username);
    if (!user) return;
    document.getElementById('editUsername').value = user.Username;
    document.getElementById('namaPengguna').value = user.Nama;
    document.getElementById('usernamePengguna').value = user.Username;
    document.getElementById('peranPengguna').value = user.Peran;
    document.getElementById('passwordPengguna').value = '';
    
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
    if (confirm(`Anda yakin ingin menghapus pengguna: ${username}?`)) {
        showLoading(true);
        const formData = new FormData();
        formData.append('action', 'deleteUser');
        formData.append('username', username);
        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.status === 'success') {
                showStatusMessage(result.message, 'success');
                appCache.allUsers = null;
                loadUsers();
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

    document.querySelectorAll('.section-nav button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.section-nav button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const sectionId = button.dataset.section;
            showSection(sectionId);
            if (sectionId === 'riwayatSection') loadRiwayatJurnal();
            else if (sectionId === 'penggunaSection') loadUsers();
            else if (sectionId === 'siswaSection') searchSiswa();
        });
    });

    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);
    document.getElementById('saveSiswaButton')?.addEventListener('click', saveSiswa);
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('searchButton')?.addEventListener('click', searchSiswa);
    document.getElementById('exportSiswaExcel')?.addEventListener('click', () => {
        const table = document.querySelector("#siswaSection table");
        if (table) {
            const wb = XLSX.utils.table_to_book(table, { sheet: "Daftar Siswa" });
            XLSX.writeFile(wb, "Daftar_Siswa.xlsx");
        }
    });
    document.getElementById('simpanPenggunaButton')?.addEventListener('click', saveUser);
    document.getElementById('batalEditPenggunaButton')?.addEventListener('click', resetFormPengguna);

    document.getElementById('nisnSearchInput')?.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchSiswa, 400);
    });
}

function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    populateAllFilters();
    loadDashboardStats();
    showSection('jurnalSection');
    document.querySelector('.section-nav button[data-section="jurnalSection"]')?.classList.add('active');
}

function initLoginPage() {
    checkAuthentication();
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
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
