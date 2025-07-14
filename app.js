/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN
 * =================================================================
 * @version 2.0 - Refactored for Robustness and Maintainability
 * @author Gemini AI Expert for User
 * 
 * Perbaikan utama:
 * - Struktur lebih rapi dengan pemisahan (CONFIG, API, UTILS, MODULES, INIT).
 * - Penanganan error yang lebih baik (aman dari ID HTML yang salah).
 * - Fungsionalitas navigasi SPA (Single Page Application) di dashboard.
 * - Konstanta terpusat untuk kemudahan pengelolaan.
 */

// -----------------------------------------------------------------
// 1. KONFIGURASI UTAMA
// -----------------------------------------------------------------
const CONFIG = {
    // URL Web App Backend Anda
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyCRYojCLqSNRWKOUdAsqaFTuc00qPRdeJU4NbIuXYHznCsedtP2nd1zWMJZeHcbnBx/exec",
};

// -----------------------------------------------------------------
// 2. MODUL API (Komunikasi dengan Backend)
// -----------------------------------------------------------------
const Api = {
    /**
     * Fungsi utama untuk mengirim data ke Google Apps Script.
     * @param {string} action - Nama aksi yang akan dipanggil di Apps Script.
     * @param {object} [payload={}] - Objek data yang akan dikirim.
     * @returns {Promise<object>} Hasil dari backend dalam format JSON.
     */
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
    /** Menampilkan atau menyembunyikan indikator loading. */
    showLoading(isLoading) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.style.display = isLoading ? 'flex' : 'none'; // Gunakan flex untuk centering
    },

    /** Menampilkan pesan status kepada pengguna. */
    showStatusMessage(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message ${type}`;
            statusEl.style.display = 'block';
            setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
        } else {
            alert(message);
        }
    },

    /** Mengisi elemen <select> (dropdown) dengan data. */
    populateDropdown(elementId, options) {
        const select = document.getElementById(elementId);
        if (select) {
            select.innerHTML = '<option value="">-- Pilih --</option>';
            options.forEach(option => {
                if(option) select.innerHTML += `<option value="${option}">${option}</option>`;
            });
        }
    },
    
    /** Menambahkan event listener dengan aman (cek jika elemen ada). */
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID "${elementId}" not found.`);
        }
    },
    
    /** Menampilkan satu bagian konten dan menyembunyikan yang lain (untuk navigasi SPA). */
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
    // --- Modul Otentikasi ---
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
        }
    },

    // --- Modul Jurnal ---
    async populateJurnalFilters() {
        try {
            const response = await fetch(`${CONFIG.WEB_APP_URL}?action=getFilterOptions`);
            const result = await response.json();
            if (result.status === 'success') {
                Utils.populateDropdown('filterTahunAjaran', result.data.tahunAjaran);
                Utils.populateDropdown('filterKelas', result.data.kelas);
                Utils.populateDropdown('filterMataPelajaran', result.data.mataPelajaran);
            }
        } catch (error) {
            Utils.showStatusMessage('Gagal memuat data filter.', 'error');
        }
    },

    // ... (Fungsi-fungsi lain seperti `loadSiswaForPresensi`, `submitJurnal`, `saveSiswa`, `loadUsers` akan sama persis)
    // ... Untuk keringkasan, kita anggap fungsi-fungsi logika tersebut sudah ada di sini ...
    // --- (Anda bisa salin-tempel fungsi-fungsi tersebut dari kode lama Anda ke sini) ---
};


// -----------------------------------------------------------------
// 5. INISIALISASI APLIKASI
// -----------------------------------------------------------------
const App = {
    initLoginPage() {
        Utils.safeAddEventListener('loginButton', 'click', AppModules.handleLogin);
    },

    initDashboardPage() {
        // Pertama, pastikan pengguna terotentikasi
        AppModules.checkAuthentication();

        // Siapkan listener & data awal
        this.setupCommonListeners();
        this.setupNavigation();
        
        // Muat data awal untuk fitur
        AppModules.populateJurnalFilters(); // Untuk form jurnal
        // AppModules.loadUsers(); // Jika Anda ingin daftar pengguna langsung tampil
    },
    
    setupCommonListeners() {
        Utils.safeAddEventListener('logoutButton', 'click', AppModules.handleLogout);
    },

    setupNavigation() {
        // Fungsi untuk membuat tombol navigasi berfungsi
        const navButtons = document.querySelectorAll('.section-nav button');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Hapus kelas aktif dari semua tombol
                navButtons.forEach(btn => btn.classList.remove('active'));
                // Tambahkan kelas aktif ke tombol yang diklik
                button.classList.add('active');
                // Panggil fungsi showSection dari Utils
                Utils.showSection(button.dataset.section);
            });
        });

        // Tampilkan bagian pertama secara default
        Utils.showSection('jurnalSection');
        // Aktifkan tombol pertama secara default
        const firstButton = document.querySelector('.section-nav button');
        if(firstButton) firstButton.classList.add('active');
    },

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
