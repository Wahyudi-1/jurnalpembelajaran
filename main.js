/**
 * ===================================================================================
 *  FRONTEND JAVASCRIPT UNTUK APLIKASI JURNAL PEMBELAJARAN
 *  Versi: 1.0
 *  Deskripsi: Script ini menangani semua interaksi pengguna, komunikasi dengan
 *             backend Google Apps Script, dan rendering dinamis konten halaman.
 * ===================================================================================
 */

// Ganti dengan URL deploy API Executable Anda yang sebenarnya
const API_URL = 'https://script.google.com/macros/s/AKfycbwztVxn_bnHRD_YuEDp6R73HtC1J6JSjj6kauncJazN2aofJv-epCrKE--5ZjAl_ZzM/exec';

// =================================================================
// FUNGSI INTI & PEMBUNGKUS API
// =================================================================

/**
 * Fungsi utama untuk memanggil Google Apps Script API.
 * Menangani otentikasi, pengiriman data, dan penanganan error secara terpusat.
 * @param {string} action - Nama aksi yang akan dipanggil di backend.
 * @param {object} [payload={}] - Data yang akan dikirim ke backend.
 * @returns {Promise<any>} Data yang dikembalikan oleh API.
 */
async function callApi(action, payload = {}) {
    showLoading(true);
    const authToken = localStorage.getItem('authToken');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors', // Wajib untuk komunikasi lintas domain
            headers: {
                'Content-Type': 'application/json',
                // Kirim token otentikasi untuk aksi yang terproteksi
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify({ action, payload }),
            redirect: "follow"
        });

        const result = await response.json();
        showLoading(false);

        if (result.status === 'error') {
            // Jika token tidak valid, otomatis logout
            if (result.message.includes("Token tidak valid")) {
                showMessage("Sesi Anda telah berakhir. Silakan login kembali.", true);
                setTimeout(handleLogout, 2000);
            }
            throw new Error(result.message);
        }
        return result.data;
    } catch (error) {
        showLoading(false);
        showMessage(error.message, true);
        // Melempar error lagi agar bisa ditangkap oleh pemanggil jika perlu
        throw error;
    }
}

// =================================================================
// FUNGSI OTENTIKASI & MANAJEMEN SESI
// =================================================================

/** Menangani proses login. */
async function handleLogin(username, password) {
    try {
        const data = await callApi('login', { username, password });
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        window.location.href = 'index.html'; // Arahkan ke dashboard
    } catch (error) {
        // Pesan error sudah ditampilkan oleh callApi
        console.error("Login failed:", error);
    }
}

/** Menangani proses logout. */
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

/** Memeriksa apakah pengguna sudah login. Jika belum, arahkan ke halaman login. */
function checkAuth() {
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'login.html';
    }
}

/** Mengambil data pengguna dari localStorage. */
function getUserData() {
    return JSON.parse(localStorage.getItem('userData'));
}


// =================================================================
// FUNGSI UTILITAS UI
// =================================================================

/** Menampilkan atau menyembunyikan indikator loading. */
function showLoading(isLoading) {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = isLoading ? 'block' : 'none';
    }
}

/** Menampilkan pesan status (sukses atau error). */
function showMessage(message, isError = false) {
    const messageEl = document.getElementById('message-box');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = isError ? 'message error' : 'message success';
        messageEl.style.display = 'block';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000); // Pesan hilang setelah 5 detik
    }
}

// =================================================================
// LOGIKA UNTUK MEMUAT KONTEN HALAMAN SECARA DINAMIS
// =================================================================

/**
 * Memuat konten dari file HTML terpisah dan menjalankannya
 * fungsi inisialisasi yang sesuai.
 * @param {string} pageName - Nama file halaman (tanpa .html).
 */
async function loadPage(pageName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error(`Halaman ${pageName} tidak ditemukan.`);
        
        mainContent.innerHTML = await response.text();
        
        // Menjalankan fungsi inisialisasi spesifik untuk halaman yang dimuat
        switch(pageName) {
            case 'manajemen-siswa':
                initManajemenSiswa();
                break;
            case 'input-jurnal':
                initInputJurnal();
                break;
            case 'lihat-jurnal':
                initLihatJurnal();
                break;
            case 'manajemen-pengguna':
                initManajemenPengguna();
                break;
        }
    } catch (error) {
        mainContent.innerHTML = `<p style="color:red;">Gagal memuat halaman: ${error.message}</p>`;
    }
}

// =================================================================
// FUNGSI INISIALISASI SPESIFIK UNTUK SETIAP HALAMAN
// =================================================================

/** Inisialisasi untuk halaman Manajemen Siswa. */
function initManajemenSiswa() {
    const form = document.getElementById('siswaForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nisn: form.nisn.value,
            tahunAjaran: form.tahunAjaran.value,
            nama: form.nama.value,
            kelas: form.kelas.value,
            mataPelajaran: form.mataPelajaran.value,
        };
        try {
            const result = await callApi('saveSiswa', payload);
            showMessage(result.message, false);
            form.reset();
        } catch (error) {
            // Pesan error sudah ditangani callApi
        }
    });
}

/** Inisialisasi untuk halaman Input Jurnal. */
async function initInputJurnal() {
    const filterTahun = document.getElementById('filter-tahun');
    const filterKelas = document.getElementById('filter-kelas');
    const filterMapel = document.getElementById('filter-mapel');
    
    // 1. Isi dropdown filter
    try {
        const options = await callApi('getFilterOptions');
        options.tahunAjaran.forEach(val => filterTahun.add(new Option(val, val)));
        options.kelas.forEach(val => filterKelas.add(new Option(val, val)));
        options.mataPelajaran.forEach(val => filterMapel.add(new Option(val, val)));
    } catch (error) {
        showMessage("Gagal memuat data filter.", true);
    }

    // 2. Tambahkan event listener untuk tombol "Tampilkan Siswa"
    document.getElementById('btn-tampilkan-siswa').addEventListener('click', async () => {
        const payload = {
            tahunAjaran: filterTahun.value,
            kelas: filterKelas.value,
            mataPelajaran: filterMapel.value,
        };
        if (!payload.tahunAjaran || !payload.kelas || !payload.mataPelajaran) {
            showMessage("Harap pilih semua filter.", true);
            return;
        }

        try {
            const siswaList = await callApi('getSiswaForPresensi', payload);
            const tbody = document.querySelector('#tabel-presensi tbody');
            tbody.innerHTML = ''; // Kosongkan tabel sebelum diisi
            
            if (siswaList.length === 0) {
                showMessage("Tidak ada siswa yang cocok dengan filter ini.", true);
                document.getElementById('form-jurnal').style.display = 'none';
                return;
            }

            siswaList.forEach(siswa => {
                const row = document.createElement('tr');
                row.dataset.nisn = siswa.nisn;
                row.dataset.nama = siswa.nama;
                row.innerHTML = `
                    <td>${siswa.nisn}</td>
                    <td>${siswa.nama}</td>
                    <td>
                        <select class="status-kehadiran">
                            <option selected>Hadir</option>
                            <option>Sakit</option>
                            <option>Izin</option>
                            <option>Absen</option>
                            <option>Terlambat</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(row);
            });
            document.getElementById('form-jurnal').style.display = 'block';
        } catch (error) {
            // error handled by callApi
        }
    });

    // 3. Tambahkan event listener untuk tombol "Kumpulkan Jurnal"
    document.getElementById('btn-kumpulkan-jurnal').addEventListener('click', async () => {
        const presensi = [];
        document.querySelectorAll('#tabel-presensi tbody tr').forEach(row => {
            presensi.push({
                nisn: row.dataset.nisn,
                nama: row.dataset.nama,
                status: row.querySelector('.status-kehadiran').value
            });
        });

        const payload = {
            tahunAjaran: filterTahun.value,
            kelas: filterKelas.value,
            mataPelajaran: filterMapel.value,
            tanggal: document.getElementById('tanggal-pembelajaran').value,
            materi: document.getElementById('materi').value,
            catatan: document.getElementById('catatan').value,
            presensi: presensi
        };
        
        if (!payload.tanggal || !payload.materi || presensi.length === 0) {
            showMessage("Tanggal, Materi, dan Daftar Siswa tidak boleh kosong.", true);
            return;
        }
        
        try {
            const result = await callApi('submitJurnal', payload);
            showMessage(result.message, false);
            document.getElementById('form-jurnal').style.display = 'none';
            document.querySelector('#tabel-presensi tbody').innerHTML = '';
        } catch(error) {
             // error handled by callApi
        }
    });
}

/** Inisialisasi untuk halaman Lihat Jurnal. */
async function initLihatJurnal() {
    const filterTahun = document.getElementById('rekap-filter-tahun');
    const filterKelas = document.getElementById('rekap-filter-kelas');
    const filterMapel = document.getElementById('rekap-filter-mapel');
    const filterGuru = document.getElementById('rekap-filter-guru');

    // 1. Isi dropdown filter
    try {
        const options = await callApi('getFilterOptions');
        options.tahunAjaran.forEach(val => filterTahun.add(new Option(val, val)));
        options.kelas.forEach(val => filterKelas.add(new Option(val, val)));
        options.mataPelajaran.forEach(val => filterMapel.add(new Option(val, val)));
        options.guru.forEach(val => filterGuru.add(new Option(val, val)));
    } catch (error) {
        showMessage("Gagal memuat data filter.", true);
    }

    // 2. Tambahkan event listener untuk tombol "Cari Rekap"
    document.getElementById('btn-cari-rekap').addEventListener('click', async () => {
        const payload = {
            tahunAjaran: filterTahun.value,
            kelas: filterKelas.value,
            mataPelajaran: filterMapel.value,
            guru: filterGuru.value,
        };
        
        try {
            const rekapData = await callApi('getRekapJurnal', payload);
            const tableHead = document.getElementById('rekap-table-head');
            const tableBody = document.getElementById('rekap-table-body');
            
            tableHead.innerHTML = `<tr><th>${rekapData.headers.join('</th><th>')}</th></tr>`;
            tableBody.innerHTML = '';

            if (rekapData.data.length === 0) {
                showMessage("Data rekap tidak ditemukan.", false);
                return;
            }

            rekapData.data.forEach(rowData => {
                const row = document.createElement('tr');
                rowData.forEach(cellData => {
                    const cell = document.createElement('td');
                    // Format tanggal agar lebih mudah dibaca
                    if (!isNaN(Date.parse(cellData)) && new Date(cellData).getFullYear() > 2000) {
                       cell.textContent = new Date(cellData).toLocaleString('id-ID');
                    } else {
                       cell.textContent = cellData;
                    }
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);
            });
        } catch (error) {
             // error handled by callApi
        }
    });
}

/** Inisialisasi untuk halaman Manajemen Pengguna. */
function initManajemenPengguna() {
    const form = document.getElementById('penggunaForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: form.username.value,
            password: form.password.value,
            nama: form.nama.value,
            peran: form.peran.value,
        };
        try {
            const result = await callApi('addUser', payload);
            showMessage(result.message, false);
            form.reset();
        } catch (error) {
             // error handled by callApi
        }
    });
}
