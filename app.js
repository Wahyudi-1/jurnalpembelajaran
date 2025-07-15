/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP & STABIL)
 * =================================================================
 * @version 3.8 - Implementasi Filter Bertingkat
 * @author Gemini AI Expert for User
 *
 * PERUBAHAN UTAMA:
 * - [FITUR] Mengimplementasikan filter bertingkat (cascading dropdowns) untuk
 *   Tahun Ajaran -> Semester -> Kelas -> Mata Pelajaran.
 * - [REFACTOR] Fungsi `populateAllFilters` digantikan dengan logika baru
 *   yang lebih dinamis (`initCascadingFilters` dan fungsi terkait).
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

// URL WEB APP YANG SUDAH TERBUKTI STABIL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGZxhWJB7ipITO5dTVG0jWzLHZa6Oxgcw8i9jqrjioVDwKugOUy8mZY-S7x8zZtzMm4g/exec";

// --- STATE APLIKASI & CACHE ---
let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUsers = []; 
let relationalFilterData = []; // Cache untuk data filter bertingkat
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

function setupPasswordToggle() {
    const toggleIcon = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (!toggleIcon || !passwordInput) return;
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg>`;
    toggleIcon.innerHTML = eyeIcon;
    toggleIcon.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.innerHTML = eyeSlashIcon;
        } else {
            passwordInput.type = 'password';
            toggleIcon.innerHTML = eyeIcon;
        }
    });
}

// ====================================================================
// TAHAP 3: FUNGSI-FUNGSI UTAMA
// ====================================================================

// --- 3.1. OTENTIKASI & SESI ---
// (Tidak ada perubahan)
function checkAuthentication() { /* ... */ }
async function handleLogin() { /* ... */ }
function handleLogout() { /* ... */ }

// --- 3.2. DASHBOARD & DATA GLOBAL ---

// [BARU] Variabel untuk menunjuk ke elemen dropdown filter utama
const filterTahunAjaranEl = document.getElementById('filterTahunAjaran');
const filterSemesterEl = document.getElementById('filterSemester');
const filterKelasEl = document.getElementById('filterKelas');
const filterMataPelajaranEl = document.getElementById('filterMataPelajaran');

/**
 * [BARU] Fungsi utama untuk memulai proses filter bertingkat.
 */
async function initCascadingFilters() {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getRelationalFilterData`);
    const result = await response.json();

    if (result.status === 'success') {
      relationalFilterData = result.data;
      
      const allTahunAjaran = [...new Set(relationalFilterData.map(item => item.tahunAjaran))];
      populateDropdown('filterTahunAjaran', allTahunAjaran.sort(), '-- Pilih Tahun Ajaran --');
      
      // Mengisi juga filter di halaman riwayat
      populateDropdown('riwayatFilterTahunAjaran', allTahunAjaran.sort(), '-- Semua Tahun --');
      
      // Reset dan nonaktifkan dropdown lainnya
      resetAndDisableDropdown(filterSemesterEl, '-- Pilih Semester --');
      resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --');
      resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --');
    } else {
      showStatusMessage('Gagal memuat data filter.', 'error');
    }
  } catch (error) {
    console.error("Gagal memuat data filter relasional:", error);
  }
}

/** [BARU] Dipanggil saat dropdown Tahun Ajaran berubah. */
function onTahunAjaranChange() {
  const selectedTahun = filterTahunAjaranEl.value;

  resetAndDisableDropdown(filterSemesterEl, '-- Pilih Semester --');
  resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --');
  resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --');
  
  if (!selectedTahun) return;

  const availableSemesters = [...new Set(
    relationalFilterData.filter(item => item.tahunAjaran == selectedTahun).map(item => item.semester)
  )];
  
  populateDropdown('filterSemester', availableSemesters.sort(), '-- Pilih Semester --');
  filterSemesterEl.disabled = false;
  
  // Juga isi filter riwayat
  populateDropdown('riwayatFilterSemester', availableSemesters.sort(), '-- Semua Semester --');
}

/** [BARU] Dipanggil saat dropdown Semester berubah. */
function onSemesterChange() {
  const selectedTahun = filterTahunAjaranEl.value;
  const selectedSemester = filterSemesterEl.value;
  
  resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --');
  resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --');

  if (!selectedSemester) return;

  const availableKelas = [...new Set(
    relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester).map(item => item.kelas)
  )];
  
  populateDropdown('filterKelas', availableKelas.sort(), '-- Pilih Kelas --');
  filterKelasEl.disabled = false;

  // Juga isi filter riwayat
  populateDropdown('riwayatFilterKelas', availableKelas.sort(), '-- Semua Kelas --');
}

/** [BARU] Dipanggil saat dropdown Kelas berubah. */
function onKelasChange() {
  const selectedTahun = filterTahunAjaranEl.value;
  const selectedSemester = filterSemesterEl.value;
  const selectedKelas = filterKelasEl.value;

  resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --');

  if (!selectedKelas) return;

  const availableMapel = [...new Set(
    relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester && item.kelas == selectedKelas)
    .flatMap(item => item.mapel)
  )];
  
  populateDropdown('filterMataPelajaran', availableMapel.sort(), '-- Pilih Mapel --');
  filterMataPelajaranEl.disabled = false;

  // Juga isi filter riwayat
  populateDropdown('riwayatFilterMapel', availableMapel.sort(), '-- Semua Mapel --');
}

/** [BARU] Fungsi pembantu untuk mereset dan menonaktifkan dropdown. */
function resetAndDisableDropdown(selectElement, defaultText) {
    if (selectElement) {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        selectElement.disabled = true;
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDashboardStats`);
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni;
            document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran;
            document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas;
        }
    } catch (error) { console.error("Gagal memuat statistik:", error); }
}

// --- 3.3. MANAJEMEN SISWA ---
// (Tidak ada perubahan)
async function searchSiswa(forceRefresh = false) { /* ... */ }
function renderSiswaTable(siswaArray) { /* ... */ }
async function saveSiswa() { /* ... */ }
function editSiswaHandler(nisn) { /* ... */ }
function resetFormSiswa() { /* ... */ }
async function deleteSiswaHandler(nisn) { /* ... */ }
function exportSiswaToExcel() { /* ... */ }

// --- 3.4. INPUT JURNAL & PRESENSI ---
// (Tidak ada perubahan signifikan, hanya validasi yang disesuaikan)
async function loadSiswaForPresensi() {
    const tahunAjaran = document.getElementById('filterTahunAjaran').value;
    const semester = document.getElementById('filterSemester').value;
    const kelas = document.getElementById('filterKelas').value;
    const mapel = document.getElementById('filterMataPelajaran').value;
    const tableBody = document.getElementById('presensiTableBody');
    if (!tahunAjaran || !semester || !kelas || !mapel) return showStatusMessage('Harap pilih Tahun Ajaran, Semester, Kelas, dan Mata Pelajaran terlebih dahulu.', 'info');
    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="3">Memuat data siswa...</td></tr>';
    const params = new URLSearchParams({ action: 'getSiswaForPresensi', tahunAjaran, semester, kelas, mapel }).toString();
    try {
        const response = await fetch(`${SCRIPT_URL}?${params}`);
        const result = await response.json();
        tableBody.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(siswa => {
                const tr = document.createElement('tr');
                tr.dataset.nisn = siswa.NISN; tr.dataset.nama = siswa.Nama;
                tr.innerHTML = `<td data-label="NISN">${siswa.NISN}</td><td data-label="Nama">${siswa.Nama}</td><td data-label="Kehadiran"><select class="kehadiran-status" style="width:100%; padding: 0.5rem;"><option value="Hadir" selected>Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alfa">Alfa</option></select></td>`;
                tableBody.appendChild(tr);
            });
        } else { tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada siswa yang ditemukan untuk filter yang dipilih.</td></tr>'; }
    } catch (error) { showStatusMessage('Gagal memuat siswa: ' + error.message, 'error'); }
    finally { showLoading(false); }
}
async function submitJurnal() { /* ... */ }

// --- 3.5. RIWAYAT JURNAL ---
// (Tidak ada perubahan)
async function loadRiwayatJurnal() { /* ... */ }
function renderRiwayatTable(riwayatArray) { /* ... */ }
function showJurnalDetail(jurnalId) { /* ... */ }
function exportRiwayatToExcel() { /* ... */ }

// --- 3.6. MANAJEMEN PENGGUNA ---
// (Tidak ada perubahan)
async function loadUsers(forceRefresh = false) { /* ... */ }
function renderUsersTable(usersArray) { /* ... */ }
async function saveUser() { /* ... */ }
function editUserHandler(username) { /* ... */ }
async function deleteUserHandler(username) { /* ... */ }
function resetFormPengguna() { /* ... */ }

// ====================================================================
// TAHAP 4: INISIALISASI DAN EVENT LISTENERS
// ====================================================================

function setupDashboardListeners() {
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);
    const navButtons = document.querySelectorAll('.section-nav button');
    navButtons.forEach(button => { /* ... */ });
    
    // [DIPERBAIKI] Listener untuk filter bertingkat
    filterTahunAjaranEl?.addEventListener('change', onTahunAjaranChange);
    filterSemesterEl?.addEventListener('change', onSemesterChange);
    filterKelasEl?.addEventListener('change', onKelasChange);

    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);
    document.getElementById('exportRiwayatButton')?.addEventListener('click', exportRiwayatToExcel);
    document.getElementById('formSiswa')?.addEventListener('submit', (e) => { e.preventDefault(); saveSiswa(); });
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('searchButton')?.addEventListener('click', () => searchSiswa(true));
    document.getElementById('exportSiswaExcel')?.addEventListener('click', exportSiswaToExcel);
    document.getElementById('nisnSearchInput')?.addEventListener('keyup', (e) => { /* ... */ });
    document.getElementById('formPengguna')?.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); });
    document.getElementById('resetPenggunaButton')?.addEventListener('click', resetFormPengguna);
}

function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    
    // [DIPERBAIKI] Ganti panggilan ke fungsi baru
    initCascadingFilters();
    
    loadDashboardStats();
    showSection('jurnalSection');
    document.querySelector('.section-nav button[data-section="jurnalSection"]')?.classList.add('active');
}

function initLoginPage() {
    checkAuthentication();
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.querySelector('.login-container form, .login-box form')?.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
    setupPasswordToggle();
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
