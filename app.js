/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP & STABIL)
 * =================================================================
 * @version 3.1 - Implementasi penuh semua fungsionalitas.
 * @author Gemini AI Expert for User
 *
 * PERUBAHAN UTAMA:
 * - [URL BARU] Menggunakan URL Web App yang telah disediakan.
 * - [IMPLEMENTASI] Fungsi untuk memuat siswa ke tabel presensi.
 * - [IMPLEMENTASI] Fungsi untuk mengumpulkan dan mengirim data Jurnal + Presensi.
 * - [IMPLEMENTASI] Fungsi untuk memuat, menampilkan, dan melihat detail Riwayat Jurnal.
 * - Kode ini dirancang untuk bekerja secara optimal dengan backend yang telah dibuat.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

// URL WEB APP YANG SUDAH TERBUKTI STABIL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZAZezsq3q_KSaBv6AqVurfghjjST5asILTu2iILP3bpnGLkL8b6joNQ0zZoZoH5DksQ/exec";

// --- STATE APLIKASI & CACHE ---
let cachedSiswaData = [];
let cachedJurnalHistory = [];
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
function checkAuthentication() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
    } else {
        const userData = JSON.parse(user);
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`;

        if (userData.peran && userData.peran.toLowerCase() !== 'admin') {
            const userManagementButton = document.querySelector('button[data-section="penggunaSection"]');
            if (userManagementButton) userManagementButton.style.display = 'none';
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
async function populateAllFilters() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFilterOptions`);
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
        const response = await fetch(`${SCRIPT_URL}?action=getDashboardStats`);
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
        const response = await fetch(`${SCRIPT_URL}?action=searchSiswa&searchTerm=${encodeURIComponent(searchTerm)}`);
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
            <td data-label="Kelas">${siswa.Kelas}</td>
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
    const form = document.getElementById('formSiswa');
    const formData = new FormData(form);
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
            searchSiswa(true);
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
    const siswa = cachedSiswaData.find(s => s.NISN == nisn);
    if (!siswa) {
        showStatusMessage('Data siswa tidak ditemukan di cache.', 'error');
        return;
    }
    document.getElementById('formNisn').value = siswa.NISN;
    document.getElementById('formNama').value = siswa.Nama;
    document.getElementById('formKelas').value = siswa.Kelas;
    document.getElementById('formTahunAjaran').value = siswa.TahunAjaran;
    document.getElementById('formMapel').value = Array.isArray(siswa.MataPelajaran) ? siswa.MataPelajaran.join(', ') : (siswa.MataPelajaran || '');
    document.getElementById('formNisnOld').value = siswa.NISN;

    const saveButton = document.getElementById('saveSiswaButton');
    saveButton.textContent = 'Update Data Siswa';
    saveButton.classList.remove('btn-accent');
    saveButton.classList.add('btn-primary');
    document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' });
}

function resetFormSiswa() {
    document.getElementById('formSiswa').reset();
    document.getElementById('formNisnOld').value = '';
    const saveButton = document.getElementById('saveSiswaButton');
    saveButton.textContent = 'Simpan Data Siswa';
    saveButton.classList.remove('btn-primary');
    saveButton.classList.add('btn-accent');
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
                searchSiswa(true);
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

function exportSiswaToExcel() {
    const table = document.querySelector("#siswaSection table");
    if (!table || table.rows.length <= 1) {
        showStatusMessage('Tidak ada data pada tabel untuk diekspor.', 'error');
        return;
    }
    try {
        const wb = XLSX.utils.table_to_book(table, { sheet: "Daftar Siswa" });
        XLSX.writeFile(wb, "Daftar_Siswa.xlsx");
        showStatusMessage('Ekspor berhasil!', 'success');
    } catch (error) {
        showStatusMessage('Gagal melakukan ekspor.', 'error');
    }
}

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
        const response = await fetch(`${SCRIPT_URL}?action=getSiswaForPresensi&kelas=${kelas}&tahunAjaran=${tahunAjaran}`);
        const result = await response.json();
        tableBody.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(siswa => {
                const tr = document.createElement('tr');
                tr.dataset.nisn = siswa.NISN; // Simpan NISN dan Nama di elemen
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

async function submitJurnal() {
    // 1. Kumpulkan data detail jurnal
    const detailJurnal = {
        tahunAjaran: document.getElementById('filterTahunAjaran').value,
        kelas: document.getElementById('filterKelas').value,
        mataPelajaran: document.getElementById('filterMataPelajaran').value,
        tanggal: document.getElementById('tanggalPembelajaran').value,
        periode: document.getElementById('periodePembelajaran').value,
        materi: document.getElementById('materiPembelajaran').value,
        catatan: document.getElementById('catatanPembelajaran').value,
    };

    // Validasi
    for (const key in detailJurnal) {
        if (!detailJurnal[key] && key !== 'catatan' && key !== 'periode') {
            return showStatusMessage(`Harap isi kolom "${key}"`, 'error');
        }
    }

    // 2. Kumpulkan data presensi
    const presensiRows = document.querySelectorAll('#presensiTableBody tr');
    if (presensiRows.length === 0 || presensiRows[0].cells.length < 3) {
        return showStatusMessage('Harap muat data siswa untuk presensi terlebih dahulu.', 'error');
    }
    const dataPresensi = Array.from(presensiRows).map(row => {
        return {
            nisn: row.dataset.nisn,
            nama: row.dataset.nama,
            status: row.querySelector('.kehadiran-status').value
        };
    });

    // 3. Gabungkan menjadi satu paket data
    const jurnalData = {
        detail: detailJurnal,
        presensi: dataPresensi
    };

    // 4. Kirim ke backend (menggunakan JSON body)
    showLoading(true);
    try {
        const response = await fetch(`${SCRIPT_URL}?action=submitJurnal`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Sesuai backend kasir
            body: JSON.stringify(jurnalData)
        });
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

// --- 3.5. RIWAYAT JURNAL ---
async function loadRiwayatJurnal() {
    const kelas = document.getElementById('riwayatFilterKelas').value;
    const mapel = document.getElementById('riwayatFilterMapel').value;
    const container = document.getElementById('riwayatContainer');
    container.innerHTML = '<p>Memuat riwayat...</p>';
    showLoading(true);

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getJurnalHistory&kelas=${kelas}&mapel=${mapel}`);
        const result = await response.json();
        container.innerHTML = '';
        if (result.status === 'success' && result.data.length > 0) {
            cachedJurnalHistory = result.data; // Simpan di cache
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

function showJurnalDetail(jurnalId) {
    const jurnal = cachedJurnalHistory.find(j => j.ID == jurnalId);
    if (!jurnal) return alert('Detail jurnal tidak ditemukan di cache!');

    let presensiList = jurnal.presensi.map(p => ` - ${p.Nama}: ${p.Status}`).join('\n');
    if (!presensiList) presensiList = "Tidak ada data presensi.";

    const detailText = `
DETAIL JURNAL
---------------------------------
Tanggal: ${new Date(jurnal.Tanggal).toLocaleDateString('id-ID')}
Kelas: ${jurnal.Kelas}
Mata Pelajaran: ${jurnal.MataPelajaran}
Periode: ${jurnal.Periode || 'N/A'}
---------------------------------
Materi:
${jurnal.Materi}

Catatan:
${jurnal.Catatan || 'Tidak ada catatan.'}
---------------------------------
PRESENSI SISWA:
${presensiList}
    `;
    alert(detailText);
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
            if (sectionId === 'riwayatSection') {
                loadRiwayatJurnal();
            }
        });
    });

    // Form Jurnal
    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);

    // Form Riwayat
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);

    // Form Siswa
    document.getElementById('formSiswa')?.addEventListener('submit', (e) => { e.preventDefault(); saveSiswa(); });
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
}

function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    
    populateAllFilters();
    loadDashboardStats();
    searchSiswa();
    
    showSection('jurnalSection');
    document.querySelector('.section-nav button[data-section="jurnalSection"]')?.classList.add('active');
}

function initLoginPage() {
    checkAuthentication();
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.querySelector('.login-container form')?.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
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
