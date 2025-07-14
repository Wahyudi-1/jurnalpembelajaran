/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI TANPA LOGIN)
 * =================================================================
 * @version 2.3 - Simplified for no-login access.
 * @author Gemini AI Expert for User
 * 
 * Perbaikan utama:
 * - Menghilangkan semua fungsionalitas login, logout, dan otentikasi.
 * - Aplikasi langsung membuka dashboard utama.
 * - Kode lebih ramping dan fokus pada manajemen data.
 * - Menggunakan URL Web App yang telah ditentukan.
 */

// -----------------------------------------------------------------
// 1. KONFIGURASI UTAMA
// -----------------------------------------------------------------
const CONFIG = {
    // URL Deployment terbaru dari Apps Script Anda
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyHpFqmNmdc16Y3wtU2acOaM54_mFUHJf96Z3_zne4vgb5IplMozMnknLMWvU6MB1DGXA/exec",
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
            (options || []).forEach(option => {
                if (option) select.innerHTML += `<option value="${option}">${option}</option>`;
            });
            select.value = currentValue;
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
    async populateAllFilters() {
        try {
            const result = await Api.postToAction('getFilterOptions');
            if (result.status === 'success') {
                Utils.populateDropdown('filterTahunAjaran', result.data.tahunAjaran);
                Utils.populateDropdown('filterKelas', result.data.kelas);
                Utils.populateDropdown('filterMataPelajaran', result.data.mataPelajaran);
                Utils.populateDropdown('riwayatFilterKelas', result.data.kelas);
                Utils.populateDropdown('riwayatFilterMapel', result.data.mataPelajaran);
            }
        } catch (error) { /* error ditangani di API */ }
    },

    async loadDashboardStats() {
        try {
            const result = await Api.postToAction('getDashboardStats');
            if (result.status === 'success') {
                document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni || '0';
                document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran || 'N/A';
                document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas || 'N/A';
            }
        } catch (error) {
            console.error("Gagal memuat statistik dashboard.");
        }
    },

    async loadSiswaForPresensi() {
        const payload = {
            tahunAjaran: document.getElementById('filterTahunAjaran').value,
            kelas: document.getElementById('filterKelas').value,
        };
        if (!payload.tahunAjaran || !payload.kelas) {
            return Utils.showStatusMessage('Tahun Ajaran dan Kelas harus dipilih.', 'error');
        }
        try {
            const result = await Api.postToAction('loadSiswaForPresensi', payload);
            const tableBody = document.getElementById('presensiTableBody');
            tableBody.innerHTML = '';
            if (result.data.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Tidak ada siswa ditemukan untuk kelas ini.</td></tr>';
                 return;
            }
            result.data.forEach(siswa => {
                const row = `
                    <tr data-nisn="${siswa.NISN}" data-nama="${siswa.Nama}">
                        <td data-label="NISN">${siswa.NISN}</td>
                        <td data-label="Nama">${siswa.Nama}</td>
                        <td data-label="Kehadiran">
                            <select class="presensi-status">
                                <option value="Hadir" selected>Hadir</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Izin">Izin</option>
                                <option value="Alfa">Alfa</option>
                            </select>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) { /* error ditangani di API */ }
    },

    async submitJurnal() {
        const presensiRows = document.querySelectorAll('#presensiTableBody tr');
        const payload = {
            tahunAjaran: document.getElementById('filterTahunAjaran').value,
            kelas: document.getElementById('filterKelas').value,
            mapel: document.getElementById('filterMataPelajaran').value,
            tanggal: document.getElementById('tanggalPembelajaran').value,
            periode: document.getElementById('periodePembelajaran').value,
            materi: document.getElementById('materiPembelajaran').value,
            catatan: document.getElementById('catatanPembelajaran').value,
            presensi: Array.from(presensiRows).map(row => ({
                nisn: row.dataset.nisn,
                nama: row.dataset.nama,
                status: row.querySelector('.presensi-status').value,
            })),
        };
        
        if (!payload.tanggal || !payload.mapel || !payload.materi || payload.presensi.length === 0) {
            return Utils.showStatusMessage('Tanggal, Mata Pelajaran, Materi, dan Daftar Siswa wajib diisi.', 'error');
        }
        
        try {
            const result = await Api.postToAction('submitJurnal', payload);
            Utils.showStatusMessage(result.message, 'success');
            document.getElementById('formJurnal').reset();
            document.getElementById('presensiTableBody').innerHTML = '';
        } catch (error) { /* error ditangani di API */ }
    },
    
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
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Tidak ada riwayat jurnal yang ditemukan.</p>';
                return;
            }

            result.data.forEach(jurnal => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h4>${jurnal.MataPelajaran} - ${jurnal.Kelas}</h4>
                    <small style="color: var(--text-light);">${new Date(jurnal.Tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
                    <p style="margin-top: 10px; border-left: 3px solid var(--border-color); padding-left: 10px;"><strong>Materi:</strong> ${(jurnal.Materi || '').substring(0, 100)}...</p>
                    <p><strong>Total Hadir:</strong> ${jurnal.presensi.filter(p => p.Status === 'Hadir').length} / ${jurnal.presensi.length} siswa</p>
                    <button class="btn btn-secondary" onclick="App.showJurnalDetail('${jurnal.ID}')">Lihat Detail</button>
                `;
                container.appendChild(card);
            });
            window.jurnalHistoryData = result.data; 
        } catch (error) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Gagal memuat riwayat.</p>';
        }
    },

    async searchSiswa() {
        const query = document.getElementById('nisnSearchInput').value;
        try {
            const result = await Api.postToAction('searchSiswa', { query });
            const tableBody = document.getElementById('siswaResultsTableBody');
            tableBody.innerHTML = '';
            if (!result.data || result.data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Data siswa tidak ditemukan.</td></tr>';
                return;
            }
            result.data.forEach(siswa => {
                const row = `
                    <tr>
                        <td data-label="NISN">${siswa.NISN}</td>
                        <td data-label="Nama">${siswa.Nama}</td>
                        <td data-label="Kelas">${siswa.Kelas}</td>
                        <td data-label="Tahun Ajaran">${siswa.TahunAjaran}</td>
                        <td data-label="Aksi">
                            <button class="btn btn-sm btn-primary" onclick="App.editSiswaHandler('${siswa.NISN}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteSiswaHandler('${siswa.NISN}')">Hapus</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } catch (error) { /* error ditangani di API */ }
    },

    async saveSiswa() {
        const siswaData = {
            oldNisn: document.getElementById('formNisnOld').value,
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
            Utils.showStatusMessage(result.message, 'success');
            App.resetFormSiswa();
            this.searchSiswa();
        } catch (error) { /* error ditangani di API */ }
    },
};

// -----------------------------------------------------------------
// 5. INISIALISASI APLIKASI & HANDLER UTAMA
// -----------------------------------------------------------------
const App = {
    initMainPage() {
        this.setupCommonListeners();
        this.setupNavigation();
        
        AppModules.populateAllFilters();
        AppModules.loadDashboardStats();
        AppModules.searchSiswa();
    },
    
    setupCommonListeners() {
        // Halaman Jurnal
        Utils.safeAddEventListener('loadSiswaButton', 'click', AppModules.loadSiswaForPresensi);
        Utils.safeAddEventListener('submitJurnalButton', 'click', AppModules.submitJurnal);
        
        // Halaman Manajemen Siswa
        Utils.safeAddEventListener('saveSiswaButton', 'click', AppModules.saveSiswa);
        Utils.safeAddEventListener('searchButton', 'click', AppModules.searchSiswa);
        Utils.safeAddEventListener('nisnSearchInput', 'keyup', (e) => { if (e.key === 'Enter') AppModules.searchSiswa(); });
        Utils.safeAddEventListener('resetSiswaButton', 'click', this.resetFormSiswa);
        Utils.safeAddEventListener('exportSiswaExcel', 'click', this.exportSiswaToExcelHandler);

        // Halaman Riwayat Jurnal
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

                if (sectionId === 'riwayatSection') {
                    AppModules.loadRiwayatJurnal();
                }
            });
        });

        Utils.showSection('jurnalSection');
        const firstButton = document.querySelector('.section-nav button[data-section="jurnalSection"]');
        if(firstButton) firstButton.classList.add('active');
    },

    showJurnalDetail(jurnalId) {
        const jurnal = (window.jurnalHistoryData || []).find(j => j.ID == jurnalId);
        if (!jurnal) return alert('Detail jurnal tidak ditemukan!');

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
                document.getElementById('formMapel').value = siswa.MataPelajaran || '';
                document.getElementById('formNisnOld').value = siswa.NISN;

                const saveButton = document.getElementById('saveSiswaButton');
                saveButton.textContent = 'Update Data Siswa';
                document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) { /* error sudah ditangani di API */ }
    },

    resetFormSiswa() {
        document.getElementById('formSiswa').reset();
        document.getElementById('formNisnOld').value = '';
        document.getElementById('saveSiswaButton').textContent = 'Simpan Data Siswa';
    },

    exportSiswaToExcelHandler() {
        const table = document.querySelector("#siswaSection table");
        if (!table || table.rows.length <= 1) {
            return Utils.showStatusMessage('Tidak ada data pada tabel untuk di-export.', 'error');
        }
        
        try {
            const wb = XLSX.utils.table_to_book(table, { sheet: "Daftar Siswa" });
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
                Utils.showStatusMessage(result.message, 'success');
                AppModules.searchSiswa();
            } catch (error) { /* error ditangani di API */ }
        }
    },

    run() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initMainPage();
        });
    }
};

// Jalankan aplikasi
App.run();
