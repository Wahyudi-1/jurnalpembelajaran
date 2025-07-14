/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN
 * =================================================================
 * Terintegrasi dengan Google Apps Script sebagai Backend.
 * 
 * @version 1.0
 * @author Gemini AI Expert for User
 */

// -----------------------------------------------------------------
// KONFIGURASI UTAMA
// -----------------------------------------------------------------
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxNColmRCCbh9TbVVk62cdgGxXvTQpTB9Wp2K3x05KWvCs61WDI2ECGyT_kQAEOL7z6/exec";

// -----------------------------------------------------------------
// FUNGSI API HELPER (Untuk Komunikasi dengan Backend)
// -----------------------------------------------------------------

/**
 * Fungsi utama untuk mengirim data ke Google Apps Script.
 * @param {string} action - Nama aksi yang akan dipanggil di Apps Script (misal: 'login', 'submitJurnal').
 * @param {object} payload - Objek data yang akan dikirim.
 * @returns {Promise<object>} Hasil dari backend dalam format JSON.
 */
async function postToAction(action, payload) {
    // Tampilkan indikator loading (opsional, tapi sangat disarankan)
    showLoading(true);

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', // Penting untuk request antar domain
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.status === "error") {
            // Jika backend mengembalikan error yang terstruktur
            throw new Error(result.message);
        }

        return result;

    } catch (error) {
        console.error(`Error during action "${action}":`, error);
        // Tampilkan pesan error ke pengguna
        showStatusMessage(`Error: ${error.message}`, 'error');
        // Melempar error lagi agar bisa ditangkap oleh fungsi pemanggil jika perlu
        throw error;
    } finally {
        // Sembunyikan indikator loading
        showLoading(false);
    }
}


// -----------------------------------------------------------------
// MODUL OTENTIKASI (LOGIN & LOGOUT)
// -----------------------------------------------------------------

/**
 * Menangani proses login pengguna.
 */
async function handleLogin() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');

    if (!usernameEl.value || !passwordEl.value) {
        showStatusMessage("Username dan password harus diisi.", 'error');
        return;
    }

    // HASH password menggunakan SHA256 dari CryptoJS sebelum dikirim
    const passwordHash = CryptoJS.SHA256(passwordEl.value).toString();

    try {
        const result = await postToAction('login', { 
            username: usernameEl.value, 
            passwordHash: passwordHash 
        });

        if (result.status === "success") {
            // Simpan data pengguna di sessionStorage untuk digunakan di halaman lain
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.data));
            // Arahkan ke halaman dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        // Error sudah ditangani di dalam postToAction, tidak perlu aksi tambahan
    }
}

/**
 * Melakukan logout pengguna.
 */
function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'index.html'; // Kembali ke halaman login
}

/**
 * Memeriksa apakah pengguna sudah login di setiap halaman yang dilindungi.
 * Panggil fungsi ini di awal setiap halaman selain login.
 */
function checkAuthentication() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = 'index.html';
    } else {
        // Anda bisa menampilkan nama pengguna di UI
        const userData = JSON.parse(user);
        const welcomeMessageEl = document.getElementById('welcomeMessage');
        if (welcomeMessageEl) {
            welcomeMessageEl.textContent = `Selamat Datang, ${userData.nama}!`;
        }
    }
}


// -----------------------------------------------------------------
// MODUL DATABASE SISWA
// -----------------------------------------------------------------

/**
 * Mencari siswa berdasarkan NISN dan menampilkan hasilnya di tabel.
 */
async function searchSiswaByNISN() {
    const nisnInput = document.getElementById('nisnSearchInput').value;
    if (nisnInput.length < 3) { // Hanya cari jika minimal 3 digit
        document.getElementById('siswaResultsTableBody').innerHTML = '';
        return;
    }

    try {
        const result = await postToAction('searchSiswa', { nisn: nisnInput });
        const tableBody = document.getElementById('siswaResultsTableBody');
        tableBody.innerHTML = ''; // Bersihkan hasil lama

        result.data.forEach(siswa => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${siswa.NISN}</td>
                <td>${siswa.Nama}</td>
                <td>${siswa.Kelas}</td>
                <td>${siswa.TahunAjaran}</td>
                <td>${siswa.MataPelajaran}</td>
                <td><button onclick="editSiswa('${siswa.NISN}')">Edit</button></td>
            `;
        });
    } catch (error) {
        // Error ditangani oleh postToAction
    }
}

/**
 * Mengisi form edit siswa dengan data yang ada.
 * (Fungsi ini perlu Anda kembangkan untuk mengambil data lengkap siswa dan mengisi form)
 * @param {string} nisn - NISN siswa yang akan diedit.
 */
function editSiswa(nisn) {
    showStatusMessage(`Fungsi edit untuk NISN ${nisn} belum diimplementasikan.`, 'info');
    // Implementasi:
    // 1. Ambil data lengkap siswa dengan action baru `getSiswaByNisn`
    // 2. Isi nilai-nilai form (#nisnForm, #namaForm, dll) dengan data tersebut.
}

/**
 * Menambah atau memperbarui data siswa dari form.
 */
async function saveSiswa() {
    // Kumpulkan data dari elemen form Anda
    const payload = {
        NISN: document.getElementById('formNisn').value,
        TahunAjaran: document.getElementById('formTahunAjaran').value,
        Nama: document.getElementById('formNama').value,
        Kelas: document.getElementById('formKelas').value,
        MataPelajaran: document.getElementById('formMapel').value
    };

    if (!payload.NISN || !payload.Nama) {
        showStatusMessage('NISN dan Nama wajib diisi.', 'error');
        return;
    }

    try {
        const result = await postToAction('addOrUpdateSiswa', payload);
        showStatusMessage(result.message, 'success');
        document.getElementById('formSiswa').reset(); // Reset form
        searchSiswaByNISN(); // Refresh daftar siswa
    } catch (error) {
        // Error ditangani oleh postToAction
    }
}


// -----------------------------------------------------------------
// MODUL JURNAL PEMBELAJARAN
// -----------------------------------------------------------------

/**
 * Mengambil data filter (Tahun Ajaran, Kelas, dll.) dan mengisinya ke dropdown.
 */
async function populateJurnalFilters() {
    try {
        // Menggunakan GET request (sesuai setup di Apps Script) bisa lebih efisien
        const response = await fetch(`${WEB_APP_URL}?action=getFilterOptions`);
        const result = await response.json();

        if (result.status === 'success') {
            const { tahunAjaran, kelas, mataPelajaran } = result.data;
            populateDropdown('filterTahunAjaran', tahunAjaran);
            populateDropdown('filterKelas', kelas);
            populateDropdown('filterMataPelajaran', mataPelajaran);
        }
    } catch (error) {
        showStatusMessage('Gagal memuat data filter.', 'error');
    }
}

/**
 * Mengambil daftar siswa berdasarkan filter dan menampilkannya di tabel presensi.
 */
async function loadSiswaForPresensi() {
    const kelas = document.getElementById('filterKelas').value;
    const tahunAjaran = document.getElementById('filterTahunAjaran').value;

    if (!kelas || !tahunAjaran) return;
    
    // Kita bisa gunakan 'searchSiswa' lagi, tapi lebih baik buat action spesifik
    // Untuk contoh ini, kita asumsikan 'searchSiswa' bisa memfilter berdasarkan kelas
    try {
        const result = await postToAction('searchSiswa', { kelas: kelas }); // Idealnya filter dgn tahun ajaran juga
        const tableBody = document.getElementById('presensiTableBody');
        tableBody.innerHTML = '';

        result.data.forEach(siswa => {
            const row = tableBody.insertRow();
            // Simpan data siswa di elemen row untuk kemudahan submit
            row.dataset.nisn = siswa.NISN;
            row.dataset.nama = siswa.Nama;

            row.innerHTML = `
                <td>${siswa.NISN}</td>
                <td>${siswa.Nama}</td>
                <td>
                    <select class="kehadiran-status">
                        <option value="Hadir" selected>Hadir</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Absen">Absen</option>
                    </select>
                </td>
            `;
        });
    } catch(error) { /* Ditangani oleh postToAction */ }
}

/**
 * Mengumpulkan semua data dari form jurnal dan presensi lalu mengirimkannya.
 */
async function submitJurnal() {
    const presensiRows = document.querySelectorAll('#presensiTableBody tr');
    if (presensiRows.length === 0) {
        showStatusMessage('Tidak ada siswa untuk diabsen.', 'error');
        return;
    }
    
    // Kumpulkan data presensi
    const presensiData = [];
    presensiRows.forEach(row => {
        presensiData.push({
            nisn: row.dataset.nisn,
            nama: row.dataset.nama,
            kehadiran: row.querySelector('.kehadiran-status').value
        });
    });

    // Kumpulkan data sesi
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const payload = {
        tahunAjaran: document.getElementById('filterTahunAjaran').value,
        kelas: document.getElementById('filterKelas').value,
        mataPelajaran: document.getElementById('filterMataPelajaran').value,
        namaGuru: user.nama, // Ambil dari data login
        materi: document.getElementById('materiPembelajaran').value,
        tanggalPembelajaran: document.getElementById('tanggalPembelajaran').value,
        periode: document.getElementById('periodePembelajaran').value,
        catatan: document.getElementById('catatanPembelajaran').value,
        presensi: presensiData // Array data presensi
    };
    
    // Validasi sederhana
    if (!payload.materi || !payload.tanggalPembelajaran) {
        showStatusMessage('Materi dan Tanggal Pembelajaran wajib diisi.', 'error');
        return;
    }

    try {
        const result = await postToAction('submitJurnal', payload);
        showStatusMessage(result.message, 'success');
        // Reset form jurnal
        document.getElementById('formJurnal').reset();
        document.getElementById('presensiTableBody').innerHTML = '';
    } catch(error) { /* Ditangani oleh postToAction */ }
}


// -----------------------------------------------------------------
// MODUL ROLE PENGGUNA
// -----------------------------------------------------------------

/**
 * Mengambil dan menampilkan daftar pengguna.
 */
async function loadUsers() {
    try {
        const result = await postToAction('getUsers', {});
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        result.data.forEach(user => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.nama}</td>
                <td>${user.peran}</td>
                <td><button onclick="editUser('${user.username}', '${user.nama}', '${user.peran}')">Edit</button></td>
            `;
        });
    } catch(error) { /* Ditangani oleh postToAction */ }
}

/**
 * Mengisi form edit dengan data pengguna yang dipilih.
 * @param {string} username 
 * @param {string} nama 
 * @param {string} peran 
 */
function editUser(username, nama, peran) {
    document.getElementById('formUserUsername').value = username;
    document.getElementById('formUserUsername').disabled = true; // Username tidak boleh diubah
    document.getElementById('formUserNama').value = nama;
    document.getElementById('formUserPeran').value = peran;
    document.getElementById('formUserPassword').placeholder = "Kosongkan jika tidak ingin mengubah password";
}

/**
 * Menyimpan data pengguna baru atau yang diedit.
 */
async function saveUser() {
    const password = document.getElementById('formUserPassword').value;
    let passwordHash = "";
    
    if (password) {
        passwordHash = CryptoJS.SHA256(password).toString();
    }
    
    const payload = {
        username: document.getElementById('formUserUsername').value,
        nama: document.getElementById('formUserNama').value,
        peran: document.getElementById('formUserPeran').value,
        passwordHash: passwordHash // Kirim hash atau string kosong
    };

    if(!payload.username || !payload.nama) {
        showStatusMessage('Username dan Nama wajib diisi.', 'error');
        return;
    }

    try {
        const result = await postToAction('addOrUpdateUser', payload);
        showStatusMessage(result.message, 'success');
        resetUserForm();
        loadUsers(); // Muat ulang daftar pengguna
    } catch(error) { /* Ditangani oleh postToAction */ }
}

function resetUserForm() {
    document.getElementById('formUser').reset();
    document.getElementById('formUserUsername').disabled = false;
    document.getElementById('formUserPassword').placeholder = "Password";
}


// -----------------------------------------------------------------
// FUNGSI UTILITAS
// -----------------------------------------------------------------

/**
 * Menampilkan atau menyembunyikan indikator loading.
 * @param {boolean} isLoading - True untuk menampilkan, false untuk menyembunyikan.
 */
function showLoading(isLoading) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
}

/**
 * Menampilkan pesan status kepada pengguna.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {'success'|'error'|'info'} type - Tipe pesan untuk styling.
 */
function showStatusMessage(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.style.display = 'block';
        // Sembunyikan pesan setelah beberapa detik
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    } else {
        // Fallback jika elemen status tidak ada
        alert(message);
    }
}

/**
 * Mengisi elemen <select> (dropdown) dengan data.
 * @param {string} elementId - ID dari elemen <select>.
 * @param {Array<string>} options - Array berisi string untuk dijadikan options.
 */
function populateDropdown(elementId, options) {
    const select = document.getElementById(elementId);
    if (select) {
        select.innerHTML = '<option value="">-- Pilih --</option>'; // Opsi default
        options.forEach(option => {
            select.innerHTML += `<option value="${option}">${option}</option>`;
        });
    }
}


// -----------------------------------------------------------------
// INISIALISASI (Event Listeners)
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop();

    if (page === 'index.html' || page === '') {
        // Halaman Login
        const loginButton = document.getElementById('loginButton');
        if (loginButton) loginButton.addEventListener('click', handleLogin);
    } else {
        // Halaman yang dilindungi
        checkAuthentication();
        
        // Listener umum untuk halaman dashboard
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);

        // Listener spesifik per halaman
        if (page === 'jurnal.html') {
            populateJurnalFilters();
            document.getElementById('loadSiswaButton').addEventListener('click', loadSiswaForPresensi);
            document.getElementById('submitJurnalButton').addEventListener('click', submitJurnal);
        }

        if (page === 'siswa.html') {
            document.getElementById('searchButton').addEventListener('click', searchSiswaByNISN);
            document.getElementById('saveSiswaButton').addEventListener('click', saveSiswa);
        }

        if (page === 'pengguna.html') {
            loadUsers();
            document.getElementById('saveUserButton').addEventListener('click', saveUser);
            document.getElementById('resetUserButton').addEventListener('click', resetUserForm);
        }
    }
});
