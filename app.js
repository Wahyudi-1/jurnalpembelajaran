/**
 * =================================================================
 * SCRIPT FRONTEND - JURNAL PEMBELAJARAN (REFAKTORISASI GAYA KASIR)
 * =================================================================
 * @version 4.0 - Rearchitected with doGet/doPost API calls
 * @author Gemini AI Expert for User
 *
 * Perbaikan utama:
 * - Mengubah modul API untuk mendukung metode GET dan POST secara terpisah.
 * - Pemanggilan API disesuaikan dengan arsitektur backend yang baru.
 * - Menggunakan FormData untuk pengiriman data form yang lebih efisien.
 */

// -----------------------------------------------------------------
// 1. KONFIGURASI UTAMA
// -----------------------------------------------------------------
const CONFIG = {
    // URL Deployment terbaru dari Apps Script Anda
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwyR1Zt8wqFEfwNgZ3N5x_JW5JjybZLebiQ9L2-5tTE7jkvR4WzXTSdjD5Nmzslk6DmCg/exec",
};

// -----------------------------------------------------------------
// 2. MODUL API (GAYA APLIKASI KASIR)
// -----------------------------------------------------------------
const Api = {
    async get(action, params = {}) {
        Utils.showLoading(true);
        const url = new URL(CONFIG.WEB_APP_URL);
        url.searchParams.append('action', action);
        for (const key in params) {
            if (params[key]) url.searchParams.append(key, params[key]);
        }
        try {
            const response = await fetch(url, { method: 'GET', mode: 'cors' });
            return await this._handleResponse(response, action);
        } catch (error) {
            this._handleError(error, action);
        } finally {
            Utils.showLoading(false);
        }
    },

    async postForm(action, formData) {
        Utils.showLoading(true);
        const url = `${CONFIG.WEB_APP_URL}?action=${action}`;
        try {
            const response = await fetch(url, { method: 'POST', mode: 'cors', body: formData });
            return await this._handleResponse(response, action);
        } catch (error) {
            this._handleError(error, action);
        } finally {
            Utils.showLoading(false);
        }
    },
    
    async postJson(action, data) {
        Utils.showLoading(true);
        const url = `${CONFIG.WEB_APP_URL}?action=${action}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Sesuai dengan backend kasir
                body: JSON.stringify(data),
            });
            return await this._handleResponse(response, action);
        } catch (error) {
            this._handleError(error, action);
        } finally {
            Utils.showLoading(false);
        }
    },

    async _handleResponse(response, action) {
        if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);
        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);
        return result;
    },

    _handleError(error, action) {
        console.error(`Error during action "${action}":`, error);
        Utils.showStatusMessage(`Error: ${error.message}`, 'error');
        throw error;
    }
};


// -----------------------------------------------------------------
// 3. MODUL UTILITAS (Tidak ada perubahan)
// -----------------------------------------------------------------
const Utils = {
    showLoading(isLoading) { const loader = document.getElementById('loadingIndicator'); if (loader) loader.style.display = isLoading ? 'flex' : 'none'; },
    showStatusMessage(message, type = 'info', duration = 5000) { const statusEl = document.getElementById('statusMessage'); if (statusEl) { statusEl.textContent = message; statusEl.className = `status-message ${type}`; statusEl.style.display = 'block'; setTimeout(() => { statusEl.style.display = 'none'; }, duration); } else { alert(message); } },
    populateDropdown(elementId, options) { const select = document.getElementById(elementId); if (select) { const currentValue = select.value; select.innerHTML = '<option value="">-- Pilih Semua --</option>'; (options || []).forEach(option => { if (option) select.innerHTML += `<option value="${option}">${option}</option>`; }); select.value = currentValue; } },
    safeAddEventListener(elementId, event, handler) { const element = document.getElementById(elementId); if (element) { element.addEventListener(event, handler); } else { console.warn(`Element with ID "${elementId}" not found.`); } },
    showSection(sectionId) { document.querySelectorAll('.content-section').forEach(section => { section.style.display = 'none'; }); const activeSection = document.getElementById(sectionId); if (activeSection) activeSection.style.display = 'block'; }
};

// -----------------------------------------------------------------
// 4. MODUL FITUR APLIKASI (Dengan pemanggilan API yang baru)
// -----------------------------------------------------------------
const AppModules = {
    async populateAllFilters() {
        try {
            const result = await Api.get('getFilterOptions'); // GET
            Utils.populateDropdown('filterTahunAjaran', result.data.tahunAjaran);
            Utils.populateDropdown('filterKelas', result.data.kelas);
            Utils.populateDropdown('filterMataPelajaran', result.data.mataPelajaran);
            Utils.populateDropdown('riwayatFilterKelas', result.data.kelas);
            Utils.populateDropdown('riwayatFilterMapel', result.data.mataPelajaran);
        } catch (error) { /* error sudah ditangani di modul API */ }
    },

    async loadDashboardStats() {
        try {
            const result = await Api.get('getDashboardStats'); // GET
            document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni || '0';
            document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran || 'N/A';
            document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas || 'N/A';
        } catch (error) { console.error("Gagal memuat statistik dashboard."); }
    },

    async loadSiswaForPresensi() {
        const formData = new FormData();
        formData.append('tahunAjaran', document.getElementById('filterTahunAjaran').value);
        formData.append('kelas', document.getElementById('filterKelas').value);
        if (!formData.get('tahunAjaran') || !formData.get('kelas')) {
            return Utils.showStatusMessage('Tahun Ajaran dan Kelas harus dipilih.', 'error');
        }
        try {
            const result = await Api.postForm('loadSiswaForPresensi', formData); // POST FORM
            const tableBody = document.getElementById('presensiTableBody');
            tableBody.innerHTML = '';
            if (result.data.length === 0) { tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Tidak ada siswa ditemukan.</td></tr>'; return; }
            result.data.forEach(siswa => { /* ... kode render tabel presensi sama ... */ });
        } catch (error) { /* error ditangani */ }
    },

    async submitJurnal() {
        const payload = { /* ... kode pengumpulan payload jurnal sama ... */ };
        if (!payload.tanggal || !payload.mapel || !payload.materi || payload.presensi.length === 0) {
            return Utils.showStatusMessage('Tanggal, Mata Pelajaran, Materi, dan Daftar Siswa wajib diisi.', 'error');
        }
        try {
            const result = await Api.postJson('submitJurnal', payload); // POST JSON
            Utils.showStatusMessage(result.message, 'success');
            document.getElementById('formJurnal').reset();
            document.getElementById('presensiTableBody').innerHTML = '';
        } catch (error) { /* error ditangani */ }
    },
    
    async loadRiwayatJurnal() {
        const params = {
            kelas: document.getElementById('riwayatFilterKelas').value,
            mapel: document.getElementById('riwayatFilterMapel').value,
        };
        const container = document.getElementById('riwayatContainer');
        container.innerHTML = '<p>Memuat riwayat...</p>';
        try {
            const result = await Api.get('getJurnalHistory', params); // GET
            container.innerHTML = '';
            if (!result.data || result.data.length === 0) { /* ... kode sama ... */ }
            result.data.forEach(jurnal => { /* ... kode render kartu riwayat sama ... */ });
            window.jurnalHistoryData = result.data; 
        } catch (error) { container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Gagal memuat riwayat.</p>'; }
    },

    async searchSiswa() {
        const query = document.getElementById('nisnSearchInput').value;
        try {
            const result = await Api.get('searchSiswa', { query: query }); // GET
            const tableBody = document.getElementById('siswaResultsTableBody');
            tableBody.innerHTML = '';
            if (!result.data || result.data.length === 0) { /* ... kode sama ... */ }
            result.data.forEach(siswa => { /* ... kode render tabel siswa sama ... */ });
        } catch (error) { /* error ditangani */ }
    },

    async saveSiswa() {
        const form = document.getElementById('formSiswa');
        const formData = new FormData(form);
        if (!formData.get('NISN') || !formData.get('Nama')) {
            return Utils.showStatusMessage('NISN dan Nama Lengkap wajib diisi.', 'error');
        }
        try {
            const result = await Api.postForm('saveSiswa', formData); // POST FORM
            Utils.showStatusMessage(result.message, 'success');
            App.resetFormSiswa();
            this.searchSiswa();
        } catch (error) { /* error ditangani */ }
    },
};

// -----------------------------------------------------------------
// 5. INISIALISASI & HANDLER UTAMA (Dengan pemanggilan API yang baru)
// -----------------------------------------------------------------
const App = {
    initMainPage() { /* ... kode init sama ... */ },
    setupCommonListeners() { /* ... kode listener sama ... */ },
    setupNavigation() { /* ... kode navigasi sama ... */ },
    showJurnalDetail(jurnalId) { /* ... kode sama ... */ },
    resetFormSiswa() { /* ... kode sama ... */ },
    exportSiswaToExcelHandler() { /* ... kode sama ... */ },

    async editSiswaHandler(nisn) {
        try {
            Utils.showStatusMessage('Mengambil data siswa...', 'info');
            const result = await Api.get('getSiswaByNisn', { nisn: nisn }); // GET
            const siswa = result.data;
            document.getElementById('formNisn').value = siswa.NISN;
            document.getElementById('formNama').value = siswa.Nama;
            document.getElementById('formKelas').value = siswa.Kelas;
            document.getElementById('formTahunAjaran').value = siswa.TahunAjaran;
            document.getElementById('formMapel').value = siswa.MataPelajaran || '';
            document.getElementById('formNisnOld').value = siswa.NISN;
            document.getElementById('saveSiswaButton').textContent = 'Update Data Siswa';
            document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' });
        } catch (error) { /* error ditangani */ }
    },

    async deleteSiswaHandler(nisn) {
        if (confirm(`Apakah Anda yakin ingin menghapus siswa dengan NISN: ${nisn}?`)) {
            const formData = new FormData();
            formData.append('nisn', nisn);
            try {
                const result = await Api.postForm('deleteSiswa', formData); // POST FORM
                Utils.showStatusMessage(result.message, 'success');
                AppModules.searchSiswa();
            } catch (error) { /* error ditangani */ }
        }
    },

    run() { document.addEventListener('DOMContentLoaded', () => { this.initMainPage(); }); }
};

// Jalankan aplikasi
App.run();
