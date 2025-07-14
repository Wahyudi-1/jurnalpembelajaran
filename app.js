/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP & STABIL)
 * =================================================================
 * @version 3.3 - Perbaikan metode pemanggilan GET request agar sesuai dengan backend.
 * @author Gemini AI Expert for User
 *
 * PERUBAHAN UTAMA:
 * - [FIX] Mengubah semua pemanggilan GET dari `?action=namaAksi` menjadi `?namaAksi=true` untuk memperbaiki error "aksi get tidak valid".
 * - Ini akan menyelesaikan masalah data yang tidak muncul di dashboard, filter, tabel siswa, riwayat, dan manajemen pengguna.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMYelEcD482DsmpyfHG0uAZMBXFS4tAKzFjvckzHJiib9P1KgFWnenMU3h_WDsUi41Gw/exec";

let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUserData = [];
let searchTimeout;

// ====================================================================
// TAHAP 2: FUNGSI-FUNGSI PEMBANTU (HELPERS)
// ====================================================================
// (Tidak ada perubahan di bagian ini)
function showLoading(isLoading) { /* ... kode asli ... */ }
function showStatusMessage(message, type = 'info', duration = 5000) { /* ... kode asli ... */ }
function populateDropdown(elementId, options, defaultOptionText = '-- Pilih --') { /* ... kode asli ... */ }
function showSection(sectionId) { /* ... kode asli ... */ }


// ====================================================================
// TAHAP 3: FUNGSI-FUNGSI UTAMA
// ====================================================================

// --- 3.1. OTENTIKASI & SESI ---
// (Tidak ada perubahan di bagian ini, karena login menggunakan POST)
function checkAuthentication() { /* ... kode asli ... */ }
async function handleLogin() { /* ... kode asli ... */ }
function handleLogout() { /* ... kode asli ... */ }


// --- 3.2. DASHBOARD & DATA GLOBAL ---
async function populateAllFilters() {
    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action
        const response = await fetch(`${SCRIPT_URL}?getFilterOptions=true`);
        const result = await response.json();
        if (result.status === 'success') {
            populateDropdown('filterTahunAjaran', result.data.tahunAjaran, '-- Pilih Tahun Ajaran --');
            populateDropdown('filterKelas', result.data.kelas, '-- Pilih Kelas --');
            populateDropdown('filterMataPelajaran', result.data.mataPelajaran, '-- Pilih Mapel --');
            populateDropdown('riwayatFilterKelas', result.data.kelas, '-- Semua Kelas --');
            populateDropdown('riwayatFilterMapel', result.data.mataPelajaran, '-- Semua Mapel --');
        }
    } catch (error) {
        console.error("Gagal memuat filter:", error);
    }
}

async function loadDashboardStats() {
    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action
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


// --- 3.3. MANAJEMEN SISWA (CRUD) ---
async function searchSiswa(forceRefresh = false) {
    const searchTerm = document.getElementById('nisnSearchInput').value.toLowerCase();
    const tableBody = document.getElementById('siswaResultsTableBody');
    if (!tableBody) return;
    
    if (!forceRefresh && !searchTerm && cachedSiswaData.length > 0) {
        renderSiswaTable(cachedSiswaData);
        return;
    }

    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="5">Mencari data siswa...</td></tr>';
    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action dan menjaga parameter lain
        const response = await fetch(`${SCRIPT_URL}?searchSiswa=true&searchTerm=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        if (result.status === 'success') {
            if (!searchTerm) cachedSiswaData = result.data;
            renderSiswaTable(result.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="5">Gagal memuat: ${result.message}</td></tr>`;
        }
    } catch (error) {
        showStatusMessage('Terjadi kesalahan jaringan saat mencari siswa.', 'error');
        tableBody.innerHTML = '<tr><td colspan="5">Gagal terhubung ke server.</td></tr>';
    } finally {
        showLoading(false);
    }
}
// (Fungsi lain di bagian ini tidak berubah karena tidak melakukan GET request)
function renderSiswaTable(siswaArray) { /* ... kode asli ... */ }
async function saveSiswa() { /* ... kode asli ... */ }
function editSiswaHandler(nisn) { /* ... kode asli ... */ }
function resetFormSiswa() { /* ... kode asli ... */ }
async function deleteSiswaHandler(nisn) { /* ... kode asli ... */ }
function exportSiswaToExcel() { /* ... kode asli ... */ }


// --- 3.4. INPUT JURNAL & PRESENSI ---
async function loadSiswaForPresensi() {
    const kelas = document.getElementById('filterKelas').value;
    const tahunAjaran = document.getElementById('filterTahunAjaran').value;
    const tableBody = document.getElementById('presensiTableBody');

    if (!kelas || !tahunAjaran) {
        return showStatusMessage('Pilih Tahun Ajaran dan Kelas terlebih dahulu.', 'info');
    }
    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="3">Memuat data siswa...</td></tr>';
    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action dan menjaga parameter lain
        const response = await fetch(`${SCRIPT_URL}?getSiswaForPresensi=true&kelas=${kelas}&tahunAjaran=${tahunAjaran}`);
        const result = await response.json();
        tableBody.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(siswa => {
                const tr = document.createElement('tr');
                tr.dataset.nisn = siswa.NISN;
                tr.dataset.nama = siswa.Nama;
                tr.innerHTML = `
                    <td data-label="NISN">${siswa.NISN}</td>
                    <td data-label="Nama">${siswa.Nama}</td>
                    <td data-label="Kehadiran">
                        <select class="kehadiran-status" style="width:100%; padding: 0.5rem;">
                            <option value="Hadir" selected>Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Alfa">Alfa</option>
                        </select>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">Tidak ada siswa yang ditemukan untuk kelas dan tahun ajaran ini.</td></tr>';
        }
    } catch (error) {
        showStatusMessage('Gagal memuat siswa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}
// (Fungsi submitJurnal tidak berubah karena menggunakan POST)
async function submitJurnal() { /* ... kode asli ... */ }


// --- 3.5. RIWAYAT JURNAL ---
async function loadRiwayatJurnal() {
    const kelas = document.getElementById('riwayatFilterKelas').value;
    const mapel = document.getElementById('riwayatFilterMapel').value;
    const container = document.getElementById('riwayatContainer');
    container.innerHTML = '<p>Memuat riwayat...</p>';
    showLoading(true);

    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action dan menjaga parameter lain
        const response = await fetch(`${SCRIPT_URL}?getJurnalHistory=true&kelas=${kelas}&mapel=${mapel}`);
        const result = await response.json();
        container.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            cachedJurnalHistory = result.data;
            result.data.forEach(jurnal => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header" style="padding-bottom: 0.5rem; margin-bottom: 0.5rem;">${jurnal.MataPelajaran} - ${jurnal.Kelas}</div>
                    <small style="color: var(--text-light);">${new Date(jurnal.Tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
                    <p style="margin-top: 10px; font-size: 0.9rem;"><strong>Materi:</strong> ${jurnal.Materi.substring(0, 100)}...</p>
                    <p style="font-size: 0.9rem;"><strong>Hadir:</strong> ${jurnal.presensi.filter(p => p.Status === 'Hadir').length}/${jurnal.presensi.length} siswa</p>
                    <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="showJurnalDetail('${jurnal.ID}')">Lihat Detail</button>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Tidak ada riwayat jurnal yang ditemukan.</p>';
        }
    } catch(error) {
        showStatusMessage('Gagal memuat riwayat: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}
function showJurnalDetail(jurnalId) { /* ... kode asli ... */ }


// --- 3.6. MANAJEMEN PENGGUNA (ADMIN) ---
async function loadUsers() {
    const tableBody = document.getElementById('tabelPenggunaBody');
    if (!tableBody) return;

    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="4">Memuat data pengguna...</td></tr>';
    try {
        // [PERBAIKAN] Mengubah cara pemanggilan action
        const response = await fetch(`${SCRIPT_URL}?getUsers=true`);
        const result = await response.json();
        if (result.status === 'success') {
            cachedUserData = result.data;
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
// (Fungsi lain di bagian ini tidak berubah karena tidak melakukan GET request)
function renderUsersTable(usersArray) { /* ... kode asli ... */ }
async function saveUser() { /* ... kode asli ... */ }
function editUserHandler(username) { /* ... kode asli ... */ }
function resetFormPengguna() { /* ... kode asli ... */ }
async function deleteUserHandler(username) { /* ... kode asli ... */ }


// ====================================================================
// TAHAP 4: INISIALISASI DAN EVENT LISTENERS
// ====================================================================
// (Tidak ada perubahan di bagian ini)
function setupDashboardListeners() { /* ... kode asli ... */ }
function initDashboardPage() { /* ... kode asli ... */ }
function initLoginPage() { /* ... kode asli ... */ }


// ====================================================================
// TAHAP 5: TITIK MASUK APLIKASI (ENTRY POINT)
// ====================================================================
// (Tidak ada perubahan di bagian ini)
document.addEventListener('DOMContentLoaded', () => { /* ... kode asli ... */ });
