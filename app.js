/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI LENGKAP)
 * =================================================================
 * @version 2.2 - Fully Integrated with History, Stats, and CRUD enhancements
 * @author Gemini AI Expert for User
 * 
 * Perbaikan utama:
 * - Implementasi penuh semua fungsionalitas yang disarankan.
 * - [BARU] Halaman Riwayat Jurnal dengan filter dan detail.
 * - [BARU] Kartu Statistik pada Dashboard.
 * - [BARU] Fungsi Edit Siswa yang lengkap (mengisi form dan mode update).
 * - [BARU] Fitur Export ke Excel menggunakan SheetJS.
 * - Kode bersih dengan penambahan komentar untuk kejelasan.
 */

// -----------------------------------------------------------------
// 1. KONFIGURASI UTAMA
// -----------------------------------------------------------------
const CONFIG = {
    // Pastikan URL ini adalah URL deployment terbaru dari Apps Script Anda
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbxXe58Y8CkZDO5RGx5VGz7dGYGUhSJx3ki-nhPgFFII2VO--4fwQSJ23rB059Q10u2-uA/exec",
};

// -----------------------------------------------------------------
// 2. MODUL API (Komunikasi dengan Backend)
// -----------------------------------------------------------------
const Api = {
    async postToAction(action, payload = {}) {
        Utils.showLoading(true);
        try {
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });

            if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);

            const result = await response.json();
            if (result.status === "error") throw new Error(result.message);

            return result;
        } catch (error) {
            console.error(`Error during action "${action}":`, error);
            Utils.showStatusMessage(`Error: ${error.message}`, 'error');
            throw error;
        } finally {
            Utils.showLoading(false);
        }
    }
};

// -----------------------------------------------------------------
// 3. MODUL UTILITAS (Fungsi Pembantu)
// -----------------------------------------------------------------
const Utils = {
    showLoading(isLoading) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.style.display = isLoading ? 'flex' : 'none';
    },

    showStatusMessage(message, type = 'info', duration = 5000) {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message ${type}`;
            statusEl.style.display = 'block';
            setTimeout(() => { statusEl.style.display = 'none'; }, duration);
        } else {
            alert(message);
        }
    },

    populateDropdown(elementId, options) {
        const select = document.getElementById(elementId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Pilih Semua --</option>';
            options.forEach(option => {
                if (option) select.innerHTML += `<option value="${option}">${option}</option>`;
            });
            select.value = currentValue; // Coba pertahankan nilai sebelumnya jika ada
        }
    },
    
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID "${elementId}" not found.`);
        }
    },
    
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) activeSection.style.display = 'block';
    }
};

// -----------------------------------------------------------------
// 4. MODUL FITUR APLIKASI
// -----------------------------------------------------------------
const AppModules = {
    // --- Modul Otentikasi & Data Global ---
    async handleLogin() {
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        if (!usernameEl.value || !passwordEl.value) {
            return Utils.showStatusMessage("Username dan password harus diisi.", 'error');
        }
        const passwordHash = CryptoJS.SHA256(passwordEl.value).toString();
        try {
            const result = await Api.postToAction('login', { username: usernameEl.value, passwordHash });
            if (result.status === "success") {
                sessionStorage.setItem('loggedInUser', JSON.stringify(result.data));
                window.location.href = 'dashboard.html';
            }
        } catch (error) { /* Error sudah ditangani di Api.postToAction */ }
    },

    handleLogout() {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    },

    checkAuthentication() {
        const user = sessionStorage.getItem('loggedInUser');
        if (!user) {
            window.location.href = 'index.html';
        } else {
            const userData = JSON.parse(user);
            const welcomeEl = document.getElementById('welcomeMessage');
            if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`;
            
            if (userData.peran.toLowerCase() !== 'admin') {
                const userManagementButton = document.querySelector('button[data-section="penggunaSection"]');
                if (userManagementButton) userManagementButton.style.display = 'none';
            }
        }
    },

    async populateAllFilters() {
        try {
            const result = await Api.postToAction('getFilterOptions');
            if (result.status === 'success') {
                // Filter untuk form Jurnal
                Utils.populateDropdown('filterTahunAjaran', result.data.tahunAjaran);
                Utils.populateDropdown('filterKelas', result.data.kelas);
                Utils.populateDropdown('filterMataPelajaran', result.data.mataPelajaran);

                // [BARU] Filter untuk halaman Riwayat
                Utils.populateDropdown('riwayatFilterKelas', result.data.kelas);
                Utils.populateDropdown('riwayatFilterMapel', result.data.mataPelajaran);
            }
        } catch (error) { /* error ditangani di API */ }
    },

    // --- Modul Dashboard & Jurnal ---
    async loadDashboardStats() {
        try {
            const result = await Api.postToAction('getDashboardStats');
            if (result.status === 'success') {
                document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni;
                document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran;
                document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas;
            }
        } catch (error) {
            console.error("Gagal memuat statistik dashboard.");
        }
    },

    async loadSiswaForPresensi() {
        // ... (Fungsi ini tidak berubah, sudah baik) ...
    },

    async submitJurnal() {
        // ... (Fungsi ini tidak berubah, sudah baik) ...
    },
    
    // --- [BARU] Modul Riwayat Jurnal ---
    async loadRiwayatJurnal() {
        const filters = {
            kelas: document.getElementById('riwayatFilterKelas').value,
            mapel: document.getElementById('riwayatFilterMapel').value,
        };
        const container = document.getElementById('riwayatContainer');
        container.innerHTML = '<p>Memuat riwayat...</p>';

        try {
            const result = await Api.postToAction('getJurnalHistory', filters);
            container.innerHTML = '';
            if (result.data.length === 0) {
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Tidak ada riwayat jurnal yang ditemukan.</p>';
                return;
            }

            result.data.forEach(jurnal => {
                const card = document.createElement('div');
                card.className = 'card';
                // Gunakan backtick (`) untuk template literal agar mudah dibaca
                card.innerHTML = `
                    <h4 style="color: var(--primary-color);">${jurnal.MataPelajaran} - ${jurnal.Kelas}</h4>
                    <small style="color: var(--text-light);">${new Date(jurnal.Tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
                    <p style="margin-top: 10px; border-left: 3px solid var(--border-color); padding-left: 10px;"><strong>Materi:</strong> ${jurnal.Materi.substring(0, 100)}...</p>
                    <p><strong>Total Hadir:</strong> ${jurnal.presensi.filter(p => p.Status === 'Hadir').length} / ${jurnal.presensi.length} siswa</p>
                    <button class="btn btn-secondary" onclick="App.showJurnalDetail('${jurnal.ID}')">Lihat Detail</button>
                `;
                container.appendChild(card);
            });
            // Simpan hasil untuk digunakan oleh fungsi detail
            window.jurnalHistoryData = result.data; 

        } catch (error) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Gagal memuat riwayat.</p>';
        }
    },

    // --- Modul Manajemen Siswa ---
    async searchSiswa() {
        // ... (Fungsi ini tidak berubah, sudah baik) ...
    },

    async saveSiswa() {
        const oldNisn = document.getElementById('formNisnOld').value;
        const siswaData = {
            oldNisn: oldNisn, // Kirim NISN lama, kosong jika mode 'tambah'
            // Gunakan key sesuai header spreadsheet untuk kemudahan di backend
            NISN: document.getElementById('formNisn').value,
            Nama: document.getElementById('formNama').value,
            Kelas: document.getElementById('formKelas').value,
            TahunAjaran: document.getElementById('formTahunAjaran').value,
            MataPelajaran: document.getElementById('formMapel').value,
        };
        
        if (!siswaData.NISN || !siswaData.Nama) {
            return Utils.showStatusMessage('NISN dan Nama Lengkap wajib diisi.', 'error');
        }

        try {
            const result = await Api.postToAction('saveSiswa', siswaData);
            if (result.status === 'success') {
                Utils.showStatusMessage(result.message, 'success');
                App.resetFormSiswa();
                this.searchSiswa(); // Refresh tabel siswa
            }
        } catch (error) { /* error ditangani di API */ }
    },
};


// -----------------------------------------------------------------
// 5. INISIALISASI APLIKASI & HANDLER UTAMA
// -----------------------------------------------------------------
const App = {
    initLoginPage() {
        Utils.safeAddEventListener('loginButton', 'click', AppModules.handleLogin);
    },

    initDashboardPage() {
        AppModules.checkAuthentication();
        this.setupCommonListeners();
        this.setupNavigation();
        
        // Muat data awal yang dibutuhkan di seluruh dashboard
        AppModules.populateAllFilters();
        AppModules.loadDashboardStats();
        AppModules.searchSiswa(); // Tampilkan daftar siswa awal
    },
    
    setupCommonListeners() {
        // Tombol Global
        Utils.safeAddEventListener('logoutButton', 'click', AppModules.handleLogout);

        // Halaman Jurnal
        Utils.safeAddEventListener('loadSiswaButton', 'click', AppModules.loadSiswaForPresensi);
        Utils.safeAddEventListener('submitJurnalButton', 'click', AppModules.submitJurnal);
        
        // Halaman Manajemen Siswa
        Utils.safeAddEventListener('saveSiswaButton', 'click', AppModules.saveSiswa);
        Utils.safeAddEventListener('searchButton', 'click', AppModules.searchSiswa);
        Utils.safeAddEventListener('nisnSearchInput', 'keyup', (e) => { if (e.key === 'Enter') AppModules.searchSiswa(); });
        Utils.safeAddEventListener('resetSiswaButton', 'click', this.resetFormSiswa); // [BARU] Tombol reset
        Utils.safeAddEventListener('exportSiswaExcel', 'click', this.exportSiswaToExcelHandler); // [BARU] Tombol export

        // [BARU] Halaman Riwayat Jurnal
        Utils.safeAddEventListener('filterRiwayatButton', 'click', AppModules.loadRiwayatJurnal);
    },

    setupNavigation() {
        const navButtons = document.querySelectorAll('.section-nav button');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const sectionId = button.dataset.section;
                Utils.showSection(sectionId);

                // [BARU] Jika bagian riwayat yang dibuka, langsung muat datanya
                if (sectionId === 'riwayatSection') {
                    AppModules.loadRiwayatJurnal();
                }
            });
        });

        // Tampilkan halaman pertama secara default
        Utils.showSection('jurnalSection');
        const firstButton = document.querySelector('.section-nav button');
        if(firstButton) firstButton.classList.add('active');
    },

    // --- [BARU] Kumpulan Handler untuk Tombol Dinamis & Aksi Form ---

    showJurnalDetail(jurnalId) {
        const jurnal = window.jurnalHistoryData.find(j => j.ID == jurnalId);
        if (!jurnal) return alert('Detail jurnal tidak ditemukan!');

        // Membuat format teks yang rapi untuk ditampilkan di alert
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
    },

    async editSiswaHandler(nisn) {
        try {
            Utils.showStatusMessage('Mengambil data siswa...', 'info');
            const result = await Api.postToAction('getSiswaByNisn', { nisn });

            if (result.status === 'success') {
                const siswa = result.data;
                document.getElementById('formNisn').value = siswa.NISN;
                document.getElementById('formNama').value = siswa.Nama;
                document.getElementById('formKelas').value = siswa.Kelas;
                document.getElementById('formTahunAjaran').value = siswa.TahunAjaran;
                document.getElementById('formMapel').value = Array.isArray(siswa.MataPelajaran) ? siswa.MataPelajaran.join(', ') : (siswa.MataPelajaran || '');
                document.getElementById('formNisnOld').value = siswa.NISN; // Simpan NISN lama

                const saveButton = document.getElementById('saveSiswaButton');
                saveButton.textContent = 'Update Data Siswa';
                saveButton.classList.remove('btn-accent');
                saveButton.classList.add('btn-primary');

                document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) { /* error sudah ditangani di API */ }
    },

    resetFormSiswa() {
        document.getElementById('formSiswa').reset();
        document.getElementById('formNisnOld').value = '';
        
        const saveButton = document.getElementById('saveSiswaButton');
        saveButton.textContent = 'Simpan Data Siswa';
        saveButton.classList.remove('btn-primary');
        saveButton.classList.add('btn-accent');
    },

    exportSiswaToExcelHandler() {
        const table = document.querySelector("#siswaSection table");
        const tableBody = table.querySelector('tbody');

        if (!table || !tableBody || tableBody.rows.length === 0 || tableBody.rows[0].cells.length <= 1) {
            Utils.showStatusMessage('Tidak ada data pada tabel untuk di-export.', 'error');
            return;
        }
        
        try {
            // Konversi tabel HTML ke workbook SheetJS
            const wb = XLSX.utils.table_to_book(table, { sheet: "Daftar Siswa" });
            // Generate file Excel dan trigger download
            XLSX.writeFile(wb, "Daftar_Siswa.xlsx");
            Utils.showStatusMessage('Export berhasil!', 'success');
        } catch (error) {
            Utils.showStatusMessage('Gagal melakukan export.', 'error');
            console.error("Export error:", error);
        }
    },

    async deleteSiswaHandler(nisn) {
        if (confirm(`Apakah Anda yakin ingin menghapus siswa dengan NISN: ${nisn}? Aksi ini tidak dapat dibatalkan.`)) {
            try {
                const result = await Api.postToAction('deleteSiswa', { nisn });
                if (result.status === 'success') {
                    Utils.showStatusMessage('Siswa berhasil dihapus.', 'success');
                    AppModules.searchSiswa(); // Refresh tabel
                }
            } catch (error) { /* error ditangani di API */ }
        }
    },

    // --- Fungsi Utama untuk Menjalankan Aplikasi ---
    run() {
        document.addEventListener('DOMContentLoaded', () => {
            const pageName = window.location.pathname.split("/").pop();
            if (pageName === 'dashboard.html') {
                this.initDashboardPage();
            } else {
                this.initLoginPage();
            }
        });
    }
};

// Jalankan aplikasi
App.run();
