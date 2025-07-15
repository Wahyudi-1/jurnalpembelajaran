/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP & STABIL)
 * =================================================================
 * @version 3.8.2 - Perbaikan Inisialisasi Dashboard
 * @author Gemini AI Expert for User
 *
 * PERUBAHAN UTAMA:
 * - [PERBAIKAN BUG] Memperbaiki alur inisialisasi dashboard untuk mencegah
 *   race conditions dan error referensi elemen saat halaman dimuat.
 * - [OPTIMASI] Pemuatan data untuk setiap tab sekarang dipicu oleh klik
 *   pada tab yang bersangkutan, bukan saat halaman pertama kali dimuat.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYU6JsnSNQvhlGdRSRAcIdJHC1NyWPBc-CP_vjas0iBsLp3F6Wi1WmsLRRUe2G_as7Fw/exec";

let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUsers = []; 
let relationalFilterData = [];
let searchTimeout;

// ====================================================================
// TAHAP 2: FUNGSI-FUNGSI PEMBANTU (HELPERS)
// ====================================================================
// (Tidak ada perubahan di blok ini, fungsi-fungsi tetap sama)
function showLoading(isLoading) { /* ... */ }
function showStatusMessage(message, type, duration) { /* ... */ }
function populateDropdown(elementId, options, defaultOptionText) { /* ... */ }
function showSection(sectionId) { /* ... */ }
function setupPasswordToggle() { /* ... */ }

// ====================================================================
// TAHAP 3: FUNGSI-FUNGSI UTAMA
// ====================================================================

// --- 3.1. OTENTIKASI & SESI ---
// (Tidak ada perubahan)
function checkAuthentication() { /* ... */ }
async function handleLogin() { /* ... */ }
function handleLogout() { /* ... */ }

// --- 3.2. DASHBOARD & DATA GLOBAL ---
// (Tidak ada perubahan, logika filter bertingkat tetap sama)
async function initCascadingFilters() { /* ... */ }
function onTahunAjaranChange() { /* ... */ }
function onSemesterChange() { /* ... */ }
function onKelasChange() { /* ... */ }
function resetAndDisableDropdown(selectElement, defaultText) { /* ... */ }
async function loadDashboardStats() { /* ... */ }

// --- 3.3. MANAJEMEN SISWA ---
// (Tidak ada perubahan)
async function searchSiswa(forceRefresh) { /* ... */ }
function renderSiswaTable(siswaArray) { /* ... */ }
async function saveSiswa() { /* ... */ }
function editSiswaHandler(nisn) { /* ... */ }
function resetFormSiswa() { /* ... */ }
async function deleteSiswaHandler(nisn) { /* ... */ }
function exportSiswaToExcel() { /* ... */ }

// --- 3.4. INPUT JURNAL & PRESENSI ---
// (Tidak ada perubahan)
async function loadSiswaForPresensi() { /* ... */ }
async function submitJurnal() { /* ... */ }

// --- 3.5. RIWAYAT JURNAL ---
// (Tidak ada perubahan)
async function loadRiwayatJurnal() { /* ... */ }
function renderRiwayatTable(riwayatArray) { /* ... */ }
function showJurnalDetail(jurnalId) { /* ... */ }
function exportRiwayatToExcel() { /* ... */ }

// --- 3.6. MANAJEMEN PENGGUNA ---
// (Tidak ada perubahan)
async function loadUsers(forceRefresh) { /* ... */ }
function renderUsersTable(usersArray) { /* ... */ }
async function saveUser() { /* ... */ }
function editUserHandler(username) { /* ... */ }
async function deleteUserHandler(username) { /* ... */ }
function resetFormPengguna() { /* ... */ }


// ====================================================================
// TAHAP 4: INISIALISASI DAN EVENT LISTENERS
// ====================================================================

/**
 * [DIPERBAIKI] Logika pemuatan data dipindahkan ke dalam event listener klik
 * untuk efisiensi dan untuk menghindari race condition.
 */
function setupDashboardListeners() {
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);

    const navButtons = document.querySelectorAll('.section-nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const sectionId = button.dataset.section;
            showSection(sectionId);

            // Data hanya dimuat saat tab-nya aktif
            if (sectionId === 'jurnalSection') {
                loadDashboardStats();
            } else if (sectionId === 'riwayatSection') {
                loadRiwayatJurnal();
            } else if (sectionId === 'siswaSection') {
                searchSiswa(true); // Selalu paksa refresh saat tab diklik
            } else if (sectionId === 'penggunaSection') {
                loadUsers(true); // Selalu paksa refresh saat tab diklik
            }
        });
    });

    // Event listener untuk elemen-elemen spesifik di dalam form
    // Inisialisasi filter bertingkat SEBELUM menambahkan listener padanya
    initCascadingFilters().then(() => {
        document.getElementById('filterTahunAjaran')?.addEventListener('change', onTahunAjaranChange);
        document.getElementById('filterSemester')?.addEventListener('change', onSemesterChange);
        document.getElementById('filterKelas')?.addEventListener('change', onKelasChange);
    });

    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);
    document.getElementById('exportRiwayatButton')?.addEventListener('click', exportRiwayatToExcel);
    document.getElementById('formSiswa')?.addEventListener('submit', (e) => { e.preventDefault(); saveSiswa(); });
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('searchButton')?.addEventListener('click', () => searchSiswa(true));
    document.getElementById('exportSiswaExcel')?.addEventListener('click', exportSiswaToExcel);
    document.getElementById('nisnSearchInput')?.addEventListener('keyup', (e) => {
        clearTimeout(searchTimeout);
        if (e.key === 'Enter') searchSiswa(true);
        else searchTimeout = setTimeout(() => searchSiswa(true), 400);
    });
    document.getElementById('formPengguna')?.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); });
    document.getElementById('resetPenggunaButton')?.addEventListener('click', resetFormPengguna);
}

/**
 * [DIPERBAIKI] Fungsi ini sekarang lebih ramping, hanya menyiapkan
 * tampilan awal dan memuat data untuk tab default.
 */
function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    
    // Tampilkan section default dan panggil data HANYA untuk section itu
    showSection('jurnalSection');
    const defaultButton = document.querySelector('.section-nav button[data-section="jurnalSection"]');
    if (defaultButton) {
        defaultButton.classList.add('active');
        // Panggil data untuk tab pertama secara manual
        loadDashboardStats(); 
    }
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
    if (pageName === 'dashboard.html' || pageName === '') { // Menangani jika file adalah root
        // Cek jika sudah login, baru inisialisasi dashboard
        if (sessionStorage.getItem('loggedInUser')) {
            initDashboardPage();
        } else if (window.location.pathname.includes('dashboard.html')) {
            // Jika mencoba akses dashboard.html tanpa login, redirect
            window.location.href = 'index.html';
        } else {
            // Jika di index.html (atau root) dan belum login
            initLoginPage();
        }
    } else if (pageName === 'index.html') {
        initLoginPage();
    }
});


// Implementasi lengkap dari fungsi-fungsi yang diringkas agar kode tetap utuh
(function() {
    const allFunctions = {
        showLoading: function(isLoading) { const loader = document.getElementById('loadingIndicator'); if (loader) loader.style.display = isLoading ? 'flex' : 'none'; },
        showStatusMessage: function(message, type = 'info', duration = 5000) { const statusEl = document.getElementById('statusMessage'); if (statusEl) { statusEl.textContent = message; statusEl.className = `status-message ${type}`; statusEl.style.display = 'block'; window.scrollTo(0, 0); setTimeout(() => { statusEl.style.display = 'none'; }, duration); } else { alert(message); } },
        populateDropdown: function(elementId, options, defaultOptionText = '-- Pilih --') { const select = document.getElementById(elementId); if (select) { const currentValue = select.value; select.innerHTML = `<option value="">${defaultOptionText}</option>`; options.forEach(option => { if (option) select.innerHTML += `<option value="${option}">${option}</option>`; }); select.value = currentValue; } },
        showSection: function(sectionId) { document.querySelectorAll('.content-section').forEach(section => { section.style.display = 'none'; }); const activeSection = document.getElementById(sectionId); if (activeSection) { activeSection.style.display = 'block'; } },
        setupPasswordToggle: function() { const toggleIcon = document.getElementById('togglePassword'); const passwordInput = document.getElementById('password'); if (!toggleIcon || !passwordInput) return; const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`; const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg>`; toggleIcon.innerHTML = eyeIcon; toggleIcon.addEventListener('click', () => { if (passwordInput.type === 'password') { passwordInput.type = 'text'; toggleIcon.innerHTML = eyeSlashIcon; } else { passwordInput.type = 'password'; toggleIcon.innerHTML = eyeIcon; } }); },
        checkAuthentication: function() { const user = sessionStorage.getItem('loggedInUser'); if (!user) { if (window.location.pathname.includes('dashboard.html')) window.location.href = 'index.html'; } else { const userData = JSON.parse(user); const welcomeEl = document.getElementById('welcomeMessage'); if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`; if (userData.peran && userData.peran.toLowerCase() !== 'admin') { const btn = document.querySelector('button[data-section="penggunaSection"]'); if (btn) btn.style.display = 'none'; } } },
        handleLogin: async function() { const u = document.getElementById('username'), p = document.getElementById('password'); if (!u.value || !p.value) return showStatusMessage("Username dan password harus diisi.", 'error'); showLoading(true); const fd = new FormData(); fd.append('action', 'login'); fd.append('username', u.value); fd.append('password', p.value); try { const r = await fetch(SCRIPT_URL, { method: 'POST', body: fd }); const d = await r.json(); if (d.status === "success") { sessionStorage.setItem('loggedInUser', JSON.stringify(d.data)); window.location.href = 'dashboard.html'; } else { showStatusMessage(d.message, 'error'); } } catch (e) { showStatusMessage(`Terjadi kesalahan jaringan: ${e.message}`, 'error'); } finally { showLoading(false); } },
        handleLogout: function() { if (confirm('Apakah Anda yakin ingin logout?')) { sessionStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; } },
        initCascadingFilters: async function() { if (!document.getElementById('filterTahunAjaran')) return; try { const r = await fetch(`${SCRIPT_URL}?action=getRelationalFilterData`); const d = await r.json(); if (d.status === 'success') { relationalFilterData = d.data; const ta = [...new Set(d.data.map(i => i.tahunAjaran).filter(Boolean))].sort(); populateDropdown('filterTahunAjaran', ta, '-- Pilih Tahun Ajaran --'); populateDropdown('riwayatFilterTahunAjaran', ta, '-- Semua Tahun --'); resetAndDisableDropdown(document.getElementById('filterSemester'), '-- Pilih Semester --'); resetAndDisableDropdown(document.getElementById('filterKelas'), '-- Pilih Kelas --'); resetAndDisableDropdown(document.getElementById('filterMataPelajaran'), '-- Pilih Mapel --'); populateDropdown('riwayatFilterSemester', [], '-- Semua Semester --'); populateDropdown('riwayatFilterKelas', [], '-- Semua Kelas --'); populateDropdown('riwayatFilterMapel', [], '-- Semua Mapel --'); } else { showStatusMessage('Gagal memuat data filter.', 'error'); } } catch (e) { console.error("Gagal memuat data filter relasional:", e); } },
        onTahunAjaranChange: function() { const f1 = document.getElementById('filterTahunAjaran'), f2 = document.getElementById('filterSemester'), st = f1.value; resetAndDisableDropdown(f2, '-- Pilih Semester --'); resetAndDisableDropdown(document.getElementById('filterKelas'), '-- Pilih Kelas --'); resetAndDisableDropdown(document.getElementById('filterMataPelajaran'), '-- Pilih Mapel --'); if (!st) return; const avs = [...new Set(relationalFilterData.filter(i => i.tahunAjaran == st).map(i => i.semester).filter(Boolean))].sort(); populateDropdown('filterSemester', avs, '-- Pilih Semester --'); f2.disabled = false; populateDropdown('riwayatFilterSemester', avs, '-- Semua Semester --'); },
        onSemesterChange: function() { const f1 = document.getElementById('filterTahunAjaran'), f2 = document.getElementById('filterSemester'), f3 = document.getElementById('filterKelas'), st = f1.value, ss = f2.value; resetAndDisableDropdown(f3, '-- Pilih Kelas --'); resetAndDisableDropdown(document.getElementById('filterMataPelajaran'), '-- Pilih Mapel --'); if (!ss) return; const avk = [...new Set(relationalFilterData.filter(i => i.tahunAjaran == st && i.semester == ss).map(i => i.kelas).filter(Boolean))].sort(); populateDropdown('filterKelas', avk, '-- Pilih Kelas --'); f3.disabled = false; populateDropdown('riwayatFilterKelas', avk, '-- Semua Kelas --'); },
        onKelasChange: function() { const f1 = document.getElementById('filterTahunAjaran'), f2 = document.getElementById('filterSemester'), f3 = document.getElementById('filterKelas'), f4 = document.getElementById('filterMataPelajaran'), st = f1.value, ss = f2.value, sk = f3.value; resetAndDisableDropdown(f4, '-- Pilih Mapel --'); if (!sk) return; const avm = [...new Set(relationalFilterData.filter(i => i.tahunAjaran == st && i.semester == ss && i.kelas == sk).flatMap(i => i.mapel).filter(Boolean))].sort(); populateDropdown('filterMataPelajaran', avm, '-- Pilih Mapel --'); f4.disabled = false; populateDropdown('riwayatFilterMapel', avm, '-- Semua Mapel --'); },
        resetAndDisableDropdown: function(el, txt) { if (el) { el.innerHTML = `<option value="">${txt}</option>`; el.disabled = true; } },
        loadDashboardStats: async function() { try { const r = await fetch(`${SCRIPT_URL}?action=getDashboardStats`); const d = await r.json(); if (d.status === 'success') { document.getElementById('statTotalJurnal').textContent = d.data.totalJurnalBulanIni; document.getElementById('statKehadiran').textContent = d.data.tingkatKehadiran; document.getElementById('statMapelTeratas').textContent = d.data.mapelTeratas; } } catch (e) { console.error("Gagal memuat statistik:", e); } },
        searchSiswa: async function(forceRefresh = false) { const st = document.getElementById('nisnSearchInput').value.toLowerCase(), tb = document.getElementById('siswaResultsTableBody'); if (!tb) return; if (!forceRefresh && !st && cachedSiswaData.length > 0) { renderSiswaTable(cachedSiswaData); return; } showLoading(true); tb.innerHTML = '<tr><td colspan="5">Mencari...</td></tr>'; try { const r = await fetch(`${SCRIPT_URL}?action=searchSiswa&searchTerm=${encodeURIComponent(st)}`); const d = await r.json(); if (d.status === 'success') { if (!st) cachedSiswaData = d.data; renderSiswaTable(d.data); } else { tb.innerHTML = `<tr><td colspan="5">Gagal: ${d.message}</td></tr>`; } } catch (e) { showStatusMessage('Error jaringan.', 'error'); tb.innerHTML = '<tr><td colspan="5">Gagal terhubung.</td></tr>'; } finally { showLoading(false); } },
        renderSiswaTable: function(arr) { const tb = document.getElementById('siswaResultsTableBody'); tb.innerHTML = ''; if (arr.length === 0) { tb.innerHTML = '<tr><td colspan="5">Data tidak ditemukan.</td></tr>'; return; } arr.forEach(s => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="NISN">${s.NISN}</td><td data-label="Nama">${s.Nama}</td><td data-label="Kelas">${s.Kelas}</td><td data-label="Tahun Ajaran">${s.TahunAjaran||''}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="editSiswaHandler('${s.NISN}')">Ubah</button><button class="btn btn-sm btn-danger" onclick="deleteSiswaHandler('${s.NISN}')">Hapus</button></td>`; tb.appendChild(tr); }); },
        saveSiswa: async function() { const f = document.getElementById('formSiswa'), fd = new FormData(f), on = document.getElementById('formNisnOld').value, a = on ? 'updateSiswa' : 'addSiswa'; fd.append('action', a); if (on) fd.append('oldNisn', on); showLoading(true); try { const r = await fetch(SCRIPT_URL, { method: 'POST', body: fd }); const d = await r.json(); if (d.status === 'success') { showStatusMessage(d.message, 'success'); resetFormSiswa(); searchSiswa(true); } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); } } catch (e) { showStatusMessage(`Error: ${e.message}`, 'error'); } finally { showLoading(false); } },
        editSiswaHandler: function(nisn) { const s = cachedSiswaData.find(s => s.NISN == nisn); if (!s) return; ['formNisn', 'formNama', 'formKelas', 'formTahunAjaran', 'formMapel', 'formNisnOld'].forEach(id => document.getElementById(id).value = s[id.replace('form','').charAt(0).toLowerCase() + id.slice(5)] || ''); document.getElementById('formNisnOld').value = s.NISN; const btn = document.getElementById('saveSiswaButton'); btn.textContent = 'Update Data'; btn.classList.add('btn-primary'); document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' }); },
        resetFormSiswa: function() { document.getElementById('formSiswa').reset(); document.getElementById('formNisnOld').value = ''; const btn = document.getElementById('saveSiswaButton'); btn.textContent = 'Simpan Data'; btn.classList.remove('btn-primary'); },
        deleteSiswaHandler: async function(nisn) { if (confirm(`Yakin hapus siswa NISN: ${nisn}?`)) { showLoading(true); const fd = new FormData(); fd.append('action', 'deleteSiswa'); fd.append('nisn', nisn); try { const r = await fetch(SCRIPT_URL, { method: 'POST', body: fd }); const d = await r.json(); if (d.status === 'success') { showStatusMessage(d.message, 'success'); searchSiswa(true); } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); } } catch (e) { showStatusMessage(`Error: ${e.message}`, 'error'); } finally { showLoading(false); } } },
        exportSiswaToExcel: function() { const t = document.querySelector("#siswaSection table"); if (!t || t.rows.length <= 1) return showStatusMessage('Tidak ada data.', 'error'); try { const wb = XLSX.utils.table_to_book(t, { sheet: "Daftar Siswa" }); XLSX.writeFile(wb, "Daftar_Siswa.xlsx"); showStatusMessage('Ekspor berhasil!', 'success'); } catch (e) { showStatusMessage('Gagal ekspor.', 'error'); } },
        loadSiswaForPresensi: async function() { const ta=document.getElementById('filterTahunAjaran').value, s=document.getElementById('filterSemester').value, k=document.getElementById('filterKelas').value, m=document.getElementById('filterMataPelajaran').value, tb=document.getElementById('presensiTableBody'); if(!ta||!s||!k||!m)return showStatusMessage('Pilih semua filter terlebih dahulu.', 'info'); showLoading(true); tb.innerHTML = '<tr><td colspan="3">Memuat...</td></tr>'; const p = new URLSearchParams({ action: 'getSiswaForPresensi', tahunAjaran: ta, semester: s, kelas: k, mapel: m }).toString(); try { const r = await fetch(`${SCRIPT_URL}?${p}`); const d = await r.json(); tb.innerHTML = ''; if (d.status === 'success' && d.data.length > 0) { d.data.forEach(s => { const tr = document.createElement('tr'); tr.dataset.nisn = s.NISN; tr.dataset.nama = s.Nama; tr.innerHTML = `<td data-label="NISN">${s.NISN}</td><td data-label="Nama">${s.Nama}</td><td data-label="Kehadiran"><select class="kehadiran-status" style="width:100%; padding: 0.5rem;"><option value="Hadir" selected>Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alfa">Alfa</option></select></td>`; tb.appendChild(tr); }); } else { tb.innerHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada siswa.</td></tr>'; } } catch (e) { showStatusMessage('Error: ' + e.message, 'error'); } finally { showLoading(false); } },
        submitJurnal: async function() { const dj = { tahunAjaran: document.getElementById('filterTahunAjaran').value, semester: document.getElementById('filterSemester').value, kelas: document.getElementById('filterKelas').value, mataPelajaran: document.getElementById('filterMataPelajaran').value, tanggal: document.getElementById('tanggalPembelajaran').value, periode: document.getElementById('periodePembelajaran').value, materi: document.getElementById('materiPembelajaran').value, catatan: document.getElementById('catatanPembelajaran').value, }; for (const k in dj) { if (!dj[k] && k !== 'catatan' && k !== 'periode') return showStatusMessage(`Isi kolom "${k}"`, 'error'); } const pr = document.querySelectorAll('#presensiTableBody tr'); if (pr.length === 0 || pr[0].cells.length < 3) return showStatusMessage('Muat data siswa dahulu.', 'error'); const dp = Array.from(pr).map(r => ({ nisn: r.dataset.nisn, nama: r.dataset.nama, status: r.querySelector('.kehadiran-status').value })); const jd = { detail: dj, presensi: dp }; showLoading(true); try { const r = await fetch(`${SCRIPT_URL}?action=submitJurnal`, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(jd) }); const d = await r.json(); if (d.status === 'success') { showStatusMessage(d.message, 'success'); document.getElementById('formJurnal').reset(); document.getElementById('presensiTableBody').innerHTML = ''; initCascadingFilters(); } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); } } catch (e) { showStatusMessage(`Error: ${e.message}`, 'error'); } finally { showLoading(false); } },
        loadRiwayatJurnal: async function() { const tb = document.getElementById('riwayatTableBody'), eb = document.getElementById('exportRiwayatButton'); if (!tb) return; const p = new URLSearchParams({ action: 'getJurnalHistory', tahunAjaran: document.getElementById('riwayatFilterTahunAjaran').value, semester: document.getElementById('riwayatFilterSemester').value, kelas: document.getElementById('riwayatFilterKelas').value, mapel: document.getElementById('riwayatFilterMapel').value, tanggalMulai: document.getElementById('riwayatFilterTanggalMulai').value, tanggalSelesai: document.getElementById('riwayatFilterTanggalSelesai').value }).toString(); showLoading(true); tb.innerHTML = '<tr><td colspan="7">Memuat...</td></tr>'; eb.style.display = 'none'; try { const r = await fetch(`${SCRIPT_URL}?${p}`); const d = await r.json(); if (d.status === 'success') { cachedJurnalHistory = d.data; renderRiwayatTable(d.data); if (d.data.length > 0) eb.style.display = 'inline-block'; } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); tb.innerHTML = '<tr><td colspan="7">Gagal memuat.</td></tr>'; } } catch(e) { showStatusMessage('Error jaringan.', 'error'); tb.innerHTML = '<tr><td colspan="7">Error jaringan.</td></tr>'; } finally { showLoading(false); } },
        renderRiwayatTable: function(arr) { const tb = document.getElementById('riwayatTableBody'); tb.innerHTML = ''; if (arr.length === 0) { tb.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada riwayat.</td></tr>'; return; } arr.forEach(j => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="Tanggal">${new Date(j.Tanggal).toLocaleDateString('id-ID')}</td><td data-label="Kelas">${j.Kelas}</td><td data-label="Semester">${j.Semester||'N/A'}</td><td data-label="Mapel">${j.MataPelajaran}</td><td data-label="Materi">${(j.Materi||'').substring(0,50)}...</td><td data-label="Kehadiran">${j.Kehadiran}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="showJurnalDetail('${j.ID}')">Detail</button></td>`; tb.appendChild(tr); }); },
        showJurnalDetail: function(jId) { const j = cachedJurnalHistory.find(j => j.ID == jId); if (!j) return alert('Detail tidak ditemukan!'); alert(`DETAIL JURNAL\n---------------------------------\nTanggal: ${new Date(j.Tanggal).toLocaleDateString('id-ID')}\nKelas: ${j.Kelas}\nSemester: ${j.Semester||'N/A'}\nMata Pelajaran: ${j.MataPelajaran}\nPeriode: ${j.Periode||'N/A'}\nKehadiran: ${j.Kehadiran}\n---------------------------------\nMateri:\n${j.Materi}\n\nCatatan:\n${j.Catatan||'Tidak ada.'}`); },
        exportRiwayatToExcel: function() { if (cachedJurnalHistory.length === 0) return showStatusMessage('Tidak ada data.', 'info'); const data = cachedJurnalHistory.map(j => ({ Tanggal: new Date(j.Tanggal).toLocaleDateString('id-ID'), "Tahun Ajaran": j.TahunAjaran, Semester: j.Semester, Kelas: j.Kelas, "Mata Pelajaran": j.MataPelajaran, Materi: j.Materi, Catatan: j.Catatan, Periode: j.Periode, Kehadiran: j.Kehadiran })); const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Riwayat Jurnal"); XLSX.writeFile(wb, `Riwayat_Jurnal_${new Date().toISOString().slice(0,10)}.xlsx`); },
        loadUsers: async function(forceRefresh = false) { const tb = document.getElementById('penggunaResultsTableBody'); if (!tb) return; if (!forceRefresh && cachedUsers.length > 0) { renderUsersTable(cachedUsers); return; } showLoading(true); tb.innerHTML = '<tr><td colspan="4">Memuat...</td></tr>'; try { const r = await fetch(`${SCRIPT_URL}?action=getUsers`); const d = await r.json(); if (d.status === 'success') { cachedUsers = d.data; renderUsersTable(d.data); } else { tb.innerHTML = `<tr><td colspan="4">Gagal: ${d.message}</td></tr>`; } } catch (e) { showStatusMessage('Error jaringan.', 'error'); tb.innerHTML = '<tr><td colspan="4">Gagal terhubung.</td></tr>'; } finally { showLoading(false); } },
        renderUsersTable: function(arr) { const tb = document.getElementById('penggunaResultsTableBody'); tb.innerHTML = ''; if (arr.length === 0) { tb.innerHTML = '<tr><td colspan="4">Belum ada pengguna.</td></tr>'; return; } arr.forEach(u => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="Nama Lengkap">${u.nama}</td><td data-label="Username">${u.username}</td><td data-label="Peran">${u.peran}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="editUserHandler('${u.username}')">Ubah</button><button class="btn btn-sm btn-danger" onclick="deleteUserHandler('${u.username}')">Hapus</button></td>`; tb.appendChild(tr); }); },
        saveUser: async function() { const ou = document.getElementById('formUsernameOld').value, a = ou ? 'updateUser' : 'addUser'; const fd = new FormData(); fd.append('action', a); fd.append('nama', document.getElementById('formNamaPengguna').value); fd.append('username', document.getElementById('formUsername').value); fd.append('password', document.getElementById('formPassword').value); fd.append('peran', document.getElementById('formPeran').value); if (ou) fd.append('oldUsername', ou); if (a === 'addUser' && !fd.get('password')) return showStatusMessage('Password wajib diisi.', 'error'); showLoading(true); try { const r = await fetch(SCRIPT_URL, { method: 'POST', body: fd }); const d = await r.json(); if (d.status === 'success') { showStatusMessage(d.message, 'success'); resetFormPengguna(); loadUsers(true); } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); } } catch (e) { showStatusMessage(`Error: ${e.message}`, 'error'); } finally { showLoading(false); } },
        editUserHandler: function(u) { const user = cachedUsers.find(i => i.username === u); if (!user) return; document.getElementById('formUsernameOld').value = user.username; document.getElementById('formNamaPengguna').value = user.nama; document.getElementById('formUsername').value = user.username; document.getElementById('formPeran').value = user.peran; document.getElementById('formPassword').value = ''; document.getElementById('formPassword').placeholder = 'Kosongkan jika tidak diubah'; const btn = document.getElementById('savePenggunaButton'); btn.textContent = 'Update Pengguna'; document.getElementById('formPengguna').scrollIntoView({ behavior: 'smooth' }); },
        deleteUserHandler: async function(u) { const lu = JSON.parse(sessionStorage.getItem('loggedInUser')); if (lu && lu.username === u) return showStatusMessage('Tidak bisa hapus diri sendiri.', 'error'); if (confirm(`Yakin hapus pengguna '${u}'?`)) { showLoading(true); const fd = new FormData(); fd.append('action', 'deleteUser'); fd.append('username', u); try { const r = await fetch(SCRIPT_URL, { method: 'POST', body: fd }); const d = await r.json(); if (d.status === 'success') { showStatusMessage(d.message, 'success'); loadUsers(true); } else { showStatusMessage(`Gagal: ${d.message}`, 'error'); } } catch (e) { showStatusMessage(`Error: ${e.message}`, 'error'); } finally { showLoading(false); } } },
        resetFormPengguna: function() { document.getElementById('formPengguna').reset(); document.getElementById('formUsernameOld').value = ''; document.getElementById('savePenggunaButton').textContent = 'Simpan Pengguna'; document.getElementById('formPassword').placeholder = 'Isi password baru'; },
        setupDashboardListeners: function() { document.getElementById('logoutButton')?.addEventListener('click', handleLogout); const btns = document.querySelectorAll('.section-nav button'); btns.forEach(b => { b.addEventListener('click', () => { btns.forEach(btn => btn.classList.remove('active')); b.classList.add('active'); const sId = b.dataset.section; showSection(sId); if (sId === 'riwayatSection') loadRiwayatJurnal(); else if (sId === 'penggunaSection') loadUsers(true); else if (sId === 'jurnalSection') loadDashboardStats(); }); }); initCascadingFilters().then(() => { document.getElementById('filterTahunAjaran')?.addEventListener('change', onTahunAjaranChange); document.getElementById('filterSemester')?.addEventListener('change', onSemesterChange); document.getElementById('filterKelas')?.addEventListener('change', onKelasChange); }); document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi); document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal); document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal); document.getElementById('exportRiwayatButton')?.addEventListener('click', exportRiwayatToExcel); document.getElementById('formSiswa')?.addEventListener('submit', (e) => { e.preventDefault(); saveSiswa(); }); document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa); document.getElementById('searchButton')?.addEventListener('click', () => searchSiswa(true)); document.getElementById('exportSiswaExcel')?.addEventListener('click', exportSiswaToExcel); document.getElementById('nisnSearchInput')?.addEventListener('keyup', (e) => { clearTimeout(searchTimeout); if (e.key === 'Enter') searchSiswa(true); else searchTimeout = setTimeout(() => searchSiswa(true), 400); }); document.getElementById('formPengguna')?.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); }); document.getElementById('resetPenggunaButton')?.addEventListener('click', resetFormPengguna); },
        initDashboardPage: function() { checkAuthentication(); setupDashboardListeners(); showSection('jurnalSection'); const db = document.querySelector('.section-nav button[data-section="jurnalSection"]'); if (db) { db.classList.add('active'); loadDashboardStats(); } },
        initLoginPage: function() { checkAuthentication(); document.getElementById('loginButton')?.addEventListener('click', handleLogin); document.querySelector('.login-container form, .login-box form')?.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); }); setupPasswordToggle(); }
    };
    Object.assign(window, allFunctions);
})();
