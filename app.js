/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI FINAL & STABIL)
 * =================================================================
 * @version 3.3 - Perbaikan metode pemanggilan GET request agar sesuai dengan backend.
 * @author Gemini AI Expert for User
 *
 * FITUR UTAMA:
 * - Login & Manajemen Sesi.
 * - Dashboard Statistik.
 * - Input Jurnal & Presensi Siswa.
 * - Riwayat Jurnal dengan Filter.
 * - Manajemen Database Siswa (CRUD & Export Excel).
 * - Manajemen Pengguna (CRUD) untuk Admin.
 *
 * PERBAIKAN PENTING:
 * - [FIX] Mengubah semua pemanggilan GET dari `?action=namaAksi` menjadi `?namaAksi=true` 
 *   untuk memperbaiki error "aksi get tidak valid" dari backend Google Apps Script.
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMYelEcD482DsmpyfHG0uAZMBXFS4tAKzFjvckzHJiib9P1KgFWnenMU3h_WDsUi41Gw/exec";

// --- STATE APLIKASI & CACHE ---
let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUserData = [];
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
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
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
async function populateAllFilters() {
    try {
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
    const formSiswa = document.getElementById('formSiswa');
    const oldNisn = document.getElementById('formNisnOld').value;
    const action = oldNisn ? 'updateSiswa' : 'addSiswa';
    
    const formData = new FormData();
    formData.append('action', action);
    formData.append('nisn', document.getElementById('formNisn').value);
    formData.append('nama', document.getElementById('formNama').value);
    formData.append('kelas', document.getElementById('formKelas').value);
    formData.append('tahunAjaran', document.getElementById('formTahunAjaran').value);
    formData.append('mapel', document.getElementById('formMapel').value);
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
    document.getElementById('resetSiswaButton').style.display = 'inline-block';
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
        if (!detailJurnal[key] && key !== 'catatan' && key !== 'periode') {
            return showStatusMessage(`Harap isi kolom "${key}"`, 'error');
        }
    }

    const presensiRows = document.querySelectorAll('#presensiTableBody tr');
    if (presensiRows.length === 0 || presensiRows[0].cells.length < 3) {
        return showStatusMessage('Harap muat data siswa untuk presensi terlebih dahulu.', 'error');
    }
    const dataPresensi = Array.from(presensiRows).map(row => ({
        nisn: row.dataset.nisn,
        nama: row.dataset.nama,
        status: row.querySelector('.kehadiran-status').value
    }));

    const jurnalData = {
        action: 'submitJurnal',
        payload: {
            detail: detailJurnal,
            presensi: dataPresensi
        }
    };

    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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


// --- 3.6. MANAJEMEN PENGGUNA (ADMIN) ---
async function loadUsers() {
    const tableBody = document.getElementById('tabelPenggunaBody');
    if (!tableBody) return;

    showLoading(true);
    tableBody.innerHTML = '<tr><td colspan="4">Memuat data pengguna...</td></tr>';
    try {
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

function renderUsersTable(usersArray) {
    const tableBody = document.getElementById('tabelPenggunaBody');
    tableBody.innerHTML = '';
    if (!usersArray || usersArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Tidak ada data pengguna yang ditemukan.</td></tr>';
        return;
    }
    
    usersArray.sort((a, b) => {
        if (a.Peran === 'Admin' && b.Peran !== 'Admin') return -1;
        if (a.Peran !== 'Admin' && b.Peran === 'Admin') return 1;
        return a.Nama.localeCompare(b.Nama);
    });

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    usersArray.forEach(user => {
        const tr = document.createElement('tr');
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

    const formData = new FormData();
    formData.append('action', action);
    formData.append('nama', nama);
    formData.append('username', username);
    formData.append('peran', peran);
    if (oldUsername) formData.append('oldUsername', oldUsername);
    if (password) {
        formData.append('passwordHash', CryptoJS.SHA256(password).toString());
    }

    showLoading(true);
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            showStatusMessage(result.message, 'success');
            resetFormPengguna();
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
    const user = cachedUserData.find(u => u.Username === username);
    if (!user) {
        showStatusMessage('Data pengguna tidak ditemukan di cache.', 'error');
        return;
    }
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

    const navButtons = document.querySelectorAll('.section-nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const sectionId = button.dataset.section;
            showSection(sectionId);
            if (sectionId === 'riwayatSection') loadRiwayatJurnal();
            else if (sectionId === 'penggunaSection') loadUsers();
            else if (sectionId === 'siswaSection' && cachedSiswaData.length === 0) searchSiswa(true);
        });
    });

    // Event Listeners for Forms
    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);
    document.getElementById('filterRiwayatButton')?.addEventListener('click', loadRiwayatJurnal);
    document.getElementById('saveSiswaButton')?.addEventListener('click', saveSiswa);
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('searchButton')?.addEventListener('click', () => searchSiswa(true));
    document.getElementById('exportSiswaExcel')?.addEventListener('click', exportSiswaToExcel);
    document.getElementById('simpanPenggunaButton')?.addEventListener('click', saveUser);
    document.getElementById('batalEditPenggunaButton')?.addEventListener('click', resetFormPengguna);

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
