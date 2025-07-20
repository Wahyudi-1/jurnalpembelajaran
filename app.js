/**
 * =================================================================
 * SCRIPT UTAMA FRONTEND - JURNAL PEMBELAJARAN (VERSI DENGAN UX IMPROVEMENT)
 * =================================================================
 * @version 5.6 - Peningkatan UX pada Form Siswa
 * @author Gemini AI Expert for User
 *
 * FITUR UTAMA VERSI INI:
 * - [FITUR] Nama siswa di form Manajemen Siswa akan terisi otomatis setelah NISN diinput
 *   jika NISN tersebut sudah ada di database (cache).
 * - [FITUR] Event listener baru ditambahkan untuk mendukung fitur autofill.
 * - Kode ini disiapkan untuk bekerja dengan HTML yang sudah diubah (input semester menjadi dropdown).
 */

// ====================================================================
// TAHAP 1: KONFIGURASI GLOBAL DAN STATE APLIKASI
// ====================================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSDuPR0jSAjfjGcqCK06-aZUj9awkTteK25Kxc1F3zHBK18U6dRV0OA_SzXedhaqNTlA/exec";

let cachedSiswaData = [];
let cachedJurnalHistory = [];
let cachedUsers = [];
let cachedJenisNilai = [];
let relationalFilterData = [];
let hasLoadedRelationalData = false;
let searchTimeout;

// --- Elemen DOM untuk Fitur Nilai ---
const jenisNilaiInput = document.getElementById('jenisNilai');
const jenisNilaiSaranEl = document.getElementById('jenisNilaiSaran');
const nilaiFilterTahunAjaranEl = document.getElementById('nilaiFilterTahunAjaran');
const nilaiFilterSemesterEl = document.getElementById('nilaiFilterSemester');
const nilaiFilterKelasEl = document.getElementById('nilaiFilterKelas');
const nilaiFilterMataPelajaranEl = document.getElementById('nilaiFilterMataPelajaran');
const loadSiswaUntukNilaiButton = document.getElementById('loadSiswaUntukNilaiButton');
const areaInputNilai = document.getElementById('areaInputNilai');
const nilaiTableHead = document.getElementById('nilaiTableHead');
const nilaiTableBody = document.getElementById('nilaiTableBody');
const submitNilaiButton = document.getElementById('submitNilaiButton');


// ====================================================================
// TAHAP 2: FUNGSI-FUNGSI PEMBANTU (HELPERS)
// ====================================================================
// (Tidak ada perubahan di bagian ini)
function showLoading(isLoading) { const loader = document.getElementById('loadingIndicator'); if (loader) loader.style.display = isLoading ? 'flex' : 'none'; }
function showStatusMessage(message, type = 'info', duration = 5000) { const statusEl = document.getElementById('statusMessage'); if (statusEl) { statusEl.textContent = message; statusEl.className = `status-message ${type}`; statusEl.style.display = 'block'; window.scrollTo(0, 0); if (duration > 0) { setTimeout(() => { statusEl.style.display = 'none'; }, duration); } } else { alert(message); } }
function populateDropdown(elementId, options, defaultOptionText = '-- Pilih --') { const select = document.getElementById(elementId); if (select) { const currentValue = select.value; select.innerHTML = `<option value="">${defaultOptionText}</option>`; options.forEach(option => { if (option) select.innerHTML += `<option value="${option}">${option}</option>`; }); select.value = currentValue; } }
function showSection(sectionId) { document.querySelectorAll('.content-section').forEach(section => { section.style.display = 'none'; }); const activeSection = document.getElementById(sectionId); if (activeSection) { activeSection.style.display = 'block'; } }
function setupPasswordToggle() { const toggleIcon = document.getElementById('togglePassword'); const passwordInput = document.getElementById('password'); if (!toggleIcon || !passwordInput) return; const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`; const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg>`; toggleIcon.innerHTML = eyeIcon; toggleIcon.addEventListener('click', () => { if (passwordInput.type === 'password') { passwordInput.type = 'text'; toggleIcon.innerHTML = eyeSlashIcon; } else { passwordInput.type = 'password'; toggleIcon.innerHTML = eyeIcon; } }); }
function resetAndDisableDropdown(selectElement, defaultText) { if (selectElement) { selectElement.innerHTML = `<option value="">${defaultText}</option>`; selectElement.disabled = true; } }

// ====================================================================
// TAHAP 3: FUNGSI-FUNGSI UTAMA
// ====================================================================

// --- 3.1. OTENTIKASI & SESI ---
// (Tidak ada perubahan di bagian ini)
function checkAuthentication() { const user = sessionStorage.getItem('loggedInUser'); if (!user) { if (window.location.pathname.includes('dashboard.html')) { window.location.href = 'index.html'; } } else { const userData = JSON.parse(user); const welcomeEl = document.getElementById('welcomeMessage'); if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${userData.nama}!`; if (userData.peran && userData.peran.toLowerCase() !== 'admin') { const btnPengguna = document.querySelector('button[data-section="penggunaSection"]'); const btnSiswa = document.querySelector('button[data-section="siswaSection"]'); if (btnPengguna) btnPengguna.style.display = 'none'; if (btnSiswa) btnSiswa.style.display = 'none'; } } }
async function handleLogin() { const usernameEl = document.getElementById('username'); const passwordEl = document.getElementById('password'); if (!usernameEl.value || !passwordEl.value) { return showStatusMessage("Username dan password harus diisi.", 'error'); } showLoading(true); const formData = new FormData(); formData.append('action', 'login'); formData.append('username', usernameEl.value); formData.append('password', passwordEl.value); try { const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData }); const result = await response.json(); if (result.status === "success") { sessionStorage.setItem('loggedInUser', JSON.stringify(result.data)); window.location.href = 'dashboard.html'; } else { showStatusMessage(result.message, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } }
function handleLogout() { if (confirm('Apakah Anda yakin ingin logout?')) { sessionStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; } }

// --- 3.2. DASHBOARD & DATA GLOBAL (CACHING) ---
// (Tidak ada perubahan di bagian ini)
async function preloadAllData() { showLoading(true); showStatusMessage('Memuat data awal...', 'info', 0); const user = JSON.parse(sessionStorage.getItem('loggedInUser')); const isAdmin = user && user.peran.toLowerCase() === 'admin'; const dataPromises = [ fetch(`${SCRIPT_URL}?action=getJurnalHistory`).then(res => res.json()), fetch(`${SCRIPT_URL}?action=getUniqueJenisNilai`).then(res => res.json()) ]; if (isAdmin) { dataPromises.push( fetch(`${SCRIPT_URL}?action=searchSiswa&searchTerm=`).then(res => res.json()), fetch(`${SCRIPT_URL}?action=getUsers`).then(res => res.json()) ); } try { const results = await Promise.all(dataPromises); const [jurnalResult, jenisNilaiResult, siswaResult, usersResult] = results; if (jurnalResult.status === 'success') cachedJurnalHistory = jurnalResult.data; if (jenisNilaiResult.status === 'success') cachedJenisNilai = jenisNilaiResult.data; if (isAdmin && siswaResult && siswaResult.status === 'success') cachedSiswaData = siswaResult.data; if (isAdmin && usersResult && usersResult.status === 'success') cachedUsers = usersResult.data; showStatusMessage('Data siap. Selamat bekerja!', 'success', 3000); } catch (error) { showStatusMessage('Gagal memuat semua data awal. Beberapa halaman mungkin lambat.', 'error'); console.error("Error pre-loading data:", error); } finally { showLoading(false); } }
const filterTahunAjaranEl = document.getElementById('filterTahunAjaran'); const filterSemesterEl = document.getElementById('filterSemester'); const filterKelasEl = document.getElementById('filterKelas'); const filterMataPelajaranEl = document.getElementById('filterMataPelajaran'); const riwayatTahunAjaranEl = document.getElementById('riwayatFilterTahunAjaran'); const riwayatSemesterEl = document.getElementById('riwayatFilterSemester'); const riwayatKelasEl = document.getElementById('riwayatFilterKelas'); const riwayatMapelEl = document.getElementById('riwayatFilterMapel');
async function initCascadingFilters() { if (hasLoadedRelationalData || !filterTahunAjaranEl) return; try { const response = await fetch(`${SCRIPT_URL}?action=getRelationalFilterData`); const result = await response.json(); if (result.status === 'success') { relationalFilterData = result.data; hasLoadedRelationalData = true; const allTahunAjaran = [...new Set(result.data.map(item => item.tahunAjaran).filter(Boolean))].sort(); populateDropdown('filterTahunAjaran', allTahunAjaran, '-- Pilih Tahun Ajaran --'); resetAndDisableDropdown(filterSemesterEl, '-- Pilih Semester --'); resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --'); } else { showStatusMessage('Gagal memuat data filter utama.', 'error'); } } catch (error) { console.error("Gagal memuat data filter relasional:", error); } }
function initHistoryCascadingFilters() { if (!riwayatTahunAjaranEl || !hasLoadedRelationalData) return; const allTahunAjaran = [...new Set(relationalFilterData.map(item => item.tahunAjaran).filter(Boolean))].sort(); populateDropdown('riwayatFilterTahunAjaran', allTahunAjaran, '-- Semua Tahun --'); resetAndDisableDropdown(riwayatSemesterEl, '-- Semua Semester --'); resetAndDisableDropdown(riwayatKelasEl, '-- Semua Kelas --'); resetAndDisableDropdown(riwayatMapelEl, '-- Semua Mapel --'); }
function onTahunAjaranChange() { const selectedTahun = filterTahunAjaranEl.value; resetAndDisableDropdown(filterSemesterEl, '-- Pilih Semester --'); resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedTahun) return; const availableSemesters = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun).map(item => item.semester).filter(Boolean))].sort(); populateDropdown('filterSemester', availableSemesters, '-- Pilih Semester --'); filterSemesterEl.disabled = false; }
function onSemesterChange() { const selectedTahun = filterTahunAjaranEl.value; const selectedSemester = filterSemesterEl.value; resetAndDisableDropdown(filterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedSemester) return; const availableKelas = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester).map(item => item.kelas).filter(Boolean))].sort(); populateDropdown('filterKelas', availableKelas, '-- Pilih Kelas --'); filterKelasEl.disabled = false; }
function onKelasChange() { const selectedTahun = filterTahunAjaranEl.value; const selectedSemester = filterSemesterEl.value; const selectedKelas = filterKelasEl.value; resetAndDisableDropdown(filterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedKelas) return; const availableMapel = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester && item.kelas == selectedKelas).flatMap(item => item.mapel).filter(Boolean))].sort(); populateDropdown('filterMataPelajaran', availableMapel, '-- Pilih Mapel --'); filterMataPelajaranEl.disabled = false; }
function onHistoryTahunAjaranChange() { const selectedTahun = riwayatTahunAjaranEl.value; resetAndDisableDropdown(riwayatSemesterEl, '-- Semua Semester --'); resetAndDisableDropdown(riwayatKelasEl, '-- Semua Kelas --'); resetAndDisableDropdown(riwayatMapelEl, '-- Semua Mapel --'); if (!selectedTahun) return; const availableSemesters = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun).map(item => item.semester).filter(Boolean))].sort(); populateDropdown('riwayatFilterSemester', availableSemesters, '-- Semua Semester --'); riwayatSemesterEl.disabled = false; }
function onHistorySemesterChange() { const selectedTahun = riwayatTahunAjaranEl.value; const selectedSemester = riwayatSemesterEl.value; resetAndDisableDropdown(riwayatKelasEl, '-- Semua Kelas --'); resetAndDisableDropdown(riwayatMapelEl, '-- Semua Mapel --'); if (!selectedSemester) return; const availableKelas = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester).map(item => item.kelas).filter(Boolean))].sort(); populateDropdown('riwayatFilterKelas', availableKelas, '-- Semua Kelas --'); riwayatKelasEl.disabled = false; }
function onHistoryKelasChange() { const selectedTahun = riwayatTahunAjaranEl.value; const selectedSemester = riwayatSemesterEl.value; const selectedKelas = riwayatKelasEl.value; resetAndDisableDropdown(riwayatMapelEl, '-- Semua Mapel --'); if (!selectedKelas) return; const availableMapel = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester && item.kelas == selectedKelas).flatMap(item => item.mapel).filter(Boolean))].sort(); populateDropdown('riwayatFilterMapel', availableMapel, '-- Semua Mapel --'); riwayatMapelEl.disabled = false; }
function initNilaiCascadingFilters() { if (!nilaiFilterTahunAjaranEl || !hasLoadedRelationalData) return; const allTahunAjaran = [...new Set(relationalFilterData.map(item => item.tahunAjaran).filter(Boolean))].sort(); populateDropdown('nilaiFilterTahunAjaran', allTahunAjaran, '-- Pilih Tahun Ajaran --'); resetAndDisableDropdown(nilaiFilterSemesterEl, '-- Pilih Semester --'); resetAndDisableDropdown(nilaiFilterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(nilaiFilterMataPelajaranEl, '-- Pilih Mapel --'); }
function onNilaiTahunAjaranChange() { const selectedTahun = nilaiFilterTahunAjaranEl.value; resetAndDisableDropdown(nilaiFilterSemesterEl, '-- Pilih Semester --'); resetAndDisableDropdown(nilaiFilterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(nilaiFilterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedTahun) return; const availableSemesters = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun).map(item => item.semester).filter(Boolean))].sort(); populateDropdown('nilaiFilterSemester', availableSemesters, '-- Pilih Semester --'); nilaiFilterSemesterEl.disabled = false; }
function onNilaiSemesterChange() { const selectedTahun = nilaiFilterTahunAjaranEl.value; const selectedSemester = nilaiFilterSemesterEl.value; resetAndDisableDropdown(nilaiFilterKelasEl, '-- Pilih Kelas --'); resetAndDisableDropdown(nilaiFilterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedSemester) return; const availableKelas = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester).map(item => item.kelas).filter(Boolean))].sort(); populateDropdown('nilaiFilterKelas', availableKelas, '-- Pilih Kelas --'); nilaiFilterKelasEl.disabled = false; }
function onNilaiKelasChange() { const selectedTahun = nilaiFilterTahunAjaranEl.value; const selectedSemester = nilaiFilterSemesterEl.value; const selectedKelas = nilaiFilterKelasEl.value; resetAndDisableDropdown(nilaiFilterMataPelajaranEl, '-- Pilih Mapel --'); if (!selectedKelas) return; const availableMapel = [...new Set(relationalFilterData.filter(item => item.tahunAjaran == selectedTahun && item.semester == selectedSemester && item.kelas == selectedKelas).flatMap(item => item.mapel).filter(Boolean))].sort(); populateDropdown('nilaiFilterMataPelajaran', availableMapel, '-- Pilih Mapel --'); nilaiFilterMataPelajaranEl.disabled = false; }
async function loadDashboardStats() { try { const response = await fetch(`${SCRIPT_URL}?action=getDashboardStats`); const result = await response.json(); if (result.status === 'success') { document.getElementById('statTotalJurnal').textContent = result.data.totalJurnalBulanIni; document.getElementById('statKehadiran').textContent = result.data.tingkatKehadiran; document.getElementById('statMapelTeratas').textContent = result.data.mapelTeratas; } } catch (error) { console.error("Gagal memuat statistik:", error); } }

// --- 3.3. MANAJEMEN SISWA ---
async function refreshSiswaCache() { showLoading(true); try { const response = await fetch(`${SCRIPT_URL}?action=searchSiswa&searchTerm=`); const result = await response.json(); if (result.status === 'success') { cachedSiswaData = result.data; showStatusMessage('Data siswa berhasil diperbarui.', 'success'); } else { showStatusMessage('Gagal memperbarui data siswa.', 'error'); } } catch (error) { showStatusMessage('Kesalahan jaringan saat memperbarui data siswa.', 'error'); } finally { showLoading(false); } }
function searchSiswa() { const searchTerm = document.getElementById('nisnSearchInput').value.toLowerCase(); const dataToRender = searchTerm ? cachedSiswaData.filter(s => String(s.Nama).toLowerCase().includes(searchTerm) || String(s.NISN).toLowerCase().includes(searchTerm)) : cachedSiswaData; renderSiswaTable(dataToRender); }
function renderSiswaTable(siswaArray) { const tableBody = document.getElementById('siswaResultsTableBody'); tableBody.innerHTML = ''; if (siswaArray.length === 0) { tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Data siswa tidak ditemukan.</td></tr>'; return; } siswaArray.forEach(siswa => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="NISN">${siswa.NISN}</td><td data-label="Nama">${siswa.Nama}</td><td data-label="Kelas">${siswa.Kelas}</td><td data-label="Tahun Ajaran">${siswa.TahunAjaran || ''}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="editSiswaHandler('${siswa.NISN}', '${siswa.TahunAjaran}', '${siswa.Semester}')">Ubah</button><button class="btn btn-sm btn-danger" onclick="deleteSiswaHandler('${siswa.NISN}')">Hapus</button></td>`; tableBody.appendChild(tr); }); }
async function saveSiswa() { const form = document.getElementById('formSiswa'); const formData = new FormData(form); formData.append('action', 'saveSiswa'); showLoading(true); try { const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); resetFormSiswa(); await refreshSiswaCache(); searchSiswa(); hasLoadedRelationalData = false; initCascadingFilters(); initNilaiCascadingFilters(); } else { showStatusMessage(`Gagal: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } }
function editSiswaHandler(nisn, tahunAjaran, semester) { const siswa = cachedSiswaData.find(s => s.NISN == nisn && s.TahunAjaran == tahunAjaran && s.Semester == semester); if (!siswa) { console.error("Siswa tidak ditemukan untuk diedit:", nisn, tahunAjaran, semester); return; } document.getElementById('formNisn').value = siswa.NISN; document.getElementById('formNama').value = siswa.Nama; document.getElementById('formKelas').value = siswa.Kelas; document.getElementById('formTahunAjaran').value = siswa.TahunAjaran; document.getElementById('formMapel').value = siswa.MataPelajaran || ''; document.getElementById('formSemesterSiswa').value = siswa.Semester || ''; const saveButton = document.getElementById('saveSiswaButton'); saveButton.textContent = 'Update Data Siswa'; saveButton.classList.add('btn-primary'); document.getElementById('formSiswa').scrollIntoView({ behavior: 'smooth' }); }
function resetFormSiswa() { document.getElementById('formSiswa').reset(); const saveButton = document.getElementById('saveSiswaButton'); saveButton.textContent = 'Simpan Data Siswa'; saveButton.classList.remove('btn-primary'); }

/**
 * [FITUR BARU]
 * Mengisi kolom Nama Siswa secara otomatis berdasarkan NISN yang diinput.
 * Fungsi ini mencari nama pertama yang cocok dengan NISN yang diberikan dari data cache.
 */
function autofillNamaSiswa() {
    const nisnInputEl = document.getElementById('formNisn');
    const namaInputEl = document.getElementById('formNama');
    const nisnToFind = nisnInputEl.value.trim();

    // Hanya berjalan jika ada NISN dan kolom nama masih kosong
    // untuk mencegah menimpa nama yang diketik manual.
    if (nisnToFind && !namaInputEl.value) {
        // Cari siswa di data cache
        const siswaDitemukan = cachedSiswaData.find(siswa => String(siswa.NISN) === nisnToFind);
        
        if (siswaDitemukan) {
            namaInputEl.value = siswaDitemukan.Nama;
        }
    }
}

async function deleteSiswaHandler(nisn) { if (confirm(`Apakah Anda yakin ingin menghapus siswa dengan NISN: ${nisn}? Operasi ini akan menghapus SEMUA data siswa dengan NISN ini di semua semester.`)) { showLoading(true); const formData = new FormData(); formData.append('action', 'deleteSiswa'); formData.append('nisn', nisn); try { const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); await refreshSiswaCache(); searchSiswa(); hasLoadedRelationalData = false; initCascadingFilters(); initNilaiCascadingFilters(); } else { showStatusMessage(`Gagal menghapus: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } } }
function exportSiswaToExcel() { const table = document.querySelector("#siswaSection table"); if (!table || table.rows.length <= 1) return showStatusMessage('Tidak ada data untuk diekspor.', 'error'); try { const wb = XLSX.utils.table_to_book(table, { sheet: "Daftar Siswa" }); XLSX.writeFile(wb, "Daftar_Siswa.xlsx"); } catch (error) { showStatusMessage('Gagal melakukan ekspor.', 'error'); } }

// --- 3.4. INPUT JURNAL & PRESENSI ---
// (Tidak ada perubahan di bagian ini)
async function loadSiswaForPresensi() { const tahunAjaran = document.getElementById('filterTahunAjaran').value, semester = document.getElementById('filterSemester').value, kelas = document.getElementById('filterKelas').value, mapel = document.getElementById('filterMataPelajaran').value; const tableBody = document.getElementById('presensiTableBody'); if (!tahunAjaran || !semester || !kelas || !mapel) return showStatusMessage('Pilih semua filter (Tahun Ajaran, Semester, Kelas, Mapel) terlebih dahulu.', 'info'); showLoading(true); tableBody.innerHTML = '<tr><td colspan="3">Memuat...</td></tr>'; const params = new URLSearchParams({ action: 'getSiswaForPresensi', tahunAjaran, semester, kelas, mapel }).toString(); try { const response = await fetch(`${SCRIPT_URL}?${params}`); const result = await response.json(); tableBody.innerHTML = ''; if (result.status === 'success' && result.data.length > 0) { result.data.forEach(siswa => { const tr = document.createElement('tr'); tr.dataset.nisn = siswa.NISN; tr.dataset.nama = siswa.Nama; tr.innerHTML = `<td data-label="NISN">${siswa.NISN}</td><td data-label="Nama">${siswa.Nama}</td><td data-label="Kehadiran"><select class="kehadiran-status" style="width:100%; padding: 0.5rem;"><option value="Hadir" selected>Hadir</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alfa">Alfa</option></select></td>`; tableBody.appendChild(tr); }); } else { tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada siswa yang cocok.</td></tr>'; } } catch (error) { showStatusMessage('Gagal memuat siswa: ' + error.message, 'error'); } finally { showLoading(false); } }
async function submitJurnal() { const detailJurnal = { tahunAjaran: document.getElementById('filterTahunAjaran').value, semester: document.getElementById('filterSemester').value, kelas: document.getElementById('filterKelas').value, mataPelajaran: document.getElementById('filterMataPelajaran').value, tanggal: document.getElementById('tanggalPembelajaran').value, periode: document.getElementById('periodePembelajaran').value, materi: document.getElementById('materiPembelajaran').value, catatan: document.getElementById('catatanPembelajaran').value, }; for (const key in detailJurnal) { if (!detailJurnal[key] && key !== 'catatan' && key !== 'periode') return showStatusMessage(`Harap isi kolom "${key}"`, 'error'); } const presensiRows = document.querySelectorAll('#presensiTableBody tr'); if (presensiRows.length === 0 || (presensiRows.length > 0 && presensiRows[0].cells.length < 3) || (presensiRows[0].cells[0] && presensiRows[0].cells[0].textContent.toLowerCase().includes('tidak ada siswa'))) { return showStatusMessage('Gagal. Harap muat data siswa yang valid untuk presensi terlebih dahulu.', 'error'); } const dataPresensi = Array.from(presensiRows).map(row => ({ nisn: row.dataset.nisn, nama: row.dataset.nama, status: row.querySelector('.kehadiran-status').value })); const jurnalData = { detail: detailJurnal, presensi: dataPresensi }; showLoading(true); try { const response = await fetch(`${SCRIPT_URL}?action=submitJurnal`, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(jurnalData) }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); document.getElementById('formJurnal').reset(); document.getElementById('presensiTableBody').innerHTML = ''; initCascadingFilters(); await refreshRiwayatCache(); } else { showStatusMessage(`Gagal menyimpan jurnal: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } }

// --- 3.5. RIWAYAT JURNAL ---
// (Tidak ada perubahan di bagian ini)
async function refreshRiwayatCache() { showLoading(true); try { const response = await fetch(`${SCRIPT_URL}?action=getJurnalHistory`); const result = await response.json(); if (result.status === 'success') { cachedJurnalHistory = result.data; showStatusMessage('Riwayat jurnal berhasil diperbarui.', 'success'); applyRiwayatFilter(); } else { showStatusMessage('Gagal memperbarui riwayat jurnal.', 'error'); } } catch (error) { showStatusMessage('Kesalahan jaringan saat memperbarui riwayat.', 'error'); } finally { showLoading(false); } }
function applyRiwayatFilter() { const tahun = document.getElementById('riwayatFilterTahunAjaran').value, semester = document.getElementById('riwayatFilterSemester').value, kelas = document.getElementById('riwayatFilterKelas').value, mapel = document.getElementById('riwayatFilterMapel').value, tglMulai = document.getElementById('riwayatFilterTanggalMulai').value, tglSelesai = document.getElementById('riwayatFilterTanggalSelesai').value; const filteredData = cachedJurnalHistory.filter(jurnal => { const tanggalJurnal = new Date(jurnal.Tanggal); const start = tglMulai ? new Date(tglMulai) : null; const end = tglSelesai ? new Date(tglSelesai) : null; if (start) start.setHours(0, 0, 0, 0); if (end) end.setHours(23, 59, 59, 999); return (!tahun || jurnal.TahunAjaran == tahun) && (!semester || jurnal.Semester == semester) && (!kelas || jurnal.Kelas == kelas) && (!mapel || jurnal.MataPelajaran == mapel) && (!start || tanggalJurnal >= start) && (!end || tanggalJurnal <= end); }); renderRiwayatTable(filteredData); document.getElementById('exportRiwayatButton').style.display = filteredData.length > 0 ? 'inline-block' : 'none'; }
function renderRiwayatTable(riwayatArray) { const tableBody = document.getElementById('riwayatTableBody'); tableBody.innerHTML = ''; if (riwayatArray.length === 0) { tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada riwayat ditemukan sesuai filter.</td></tr>'; return; } riwayatArray.forEach(jurnal => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="Tanggal">${new Date(jurnal.Tanggal).toLocaleDateString('id-ID')}</td><td data-label="Kelas">${jurnal.Kelas}</td><td data-label="Semester">${jurnal.Semester || 'N/A'}</td><td data-label="Mapel">${jurnal.MataPelajaran}</td><td data-label="Materi">${(jurnal.Materi || '').substring(0, 50)}...</td><td data-label="Kehadiran">${jurnal.Kehadiran}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="showJurnalDetail('${jurnal.ID}')">Detail</button></td>`; tableBody.appendChild(tr); }); }
function showJurnalDetail(jurnalId) { const jurnal = cachedJurnalHistory.find(j => j.ID == jurnalId); if (!jurnal) return alert('Detail jurnal tidak ditemukan!'); alert(`DETAIL JURNAL\n---------------------------------\nTanggal: ${new Date(jurnal.Tanggal).toLocaleDateString('id-ID')}\nKelas: ${jurnal.Kelas}\nSemester: ${jurnal.Semester || 'N/A'}\nMata Pelajaran: ${jurnal.MataPelajaran}\nPeriode: ${jurnal.Periode || 'N/A'}\nKehadiran: ${jurnal.Kehadiran}\n---------------------------------\nMateri:\n${jurnal.Materi}\n\nCatatan:\n${jurnal.Catatan || 'Tidak ada.'}`); }
function exportRiwayatToExcel() { const tahun = document.getElementById('riwayatFilterTahunAjaran').value, semester = document.getElementById('riwayatFilterSemester').value, kelas = document.getElementById('riwayatFilterKelas').value, mapel = document.getElementById('riwayatFilterMapel').value, tglMulai = document.getElementById('riwayatFilterTanggalMulai').value, tglSelesai = document.getElementById('riwayatFilterTanggalSelesai').value; const dataToExport = cachedJurnalHistory.filter(jurnal => { const tanggalJurnal = new Date(jurnal.Tanggal); const start = tglMulai ? new Date(tglMulai) : null; const end = tglSelesai ? new Date(tglSelesai) : null; if (start) start.setHours(0, 0, 0, 0); if (end) end.setHours(23, 59, 59, 999); return (!tahun || jurnal.TahunAjaran == tahun) && (!semester || jurnal.Semester == semester) && (!kelas || jurnal.Kelas == kelas) && (!mapel || jurnal.MataPelajaran == mapel) && (!start || tanggalJurnal >= start) && (!end || tanggalJurnal <= end); }).map(j => ({ Tanggal: new Date(j.Tanggal).toLocaleDateString('id-ID'), "Tahun Ajaran": j.TahunAjaran, Semester: j.Semester, Kelas: j.Kelas, "Mata Pelajaran": j.MataPelajaran, Materi: j.Materi, Catatan: j.Catatan, Periode: j.Periode, Kehadiran: j.Kehadiran })); if (dataToExport.length === 0) return showStatusMessage('Tidak ada data untuk diekspor sesuai filter.', 'info'); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Jurnal"); XLSX.writeFile(workbook, `Riwayat_Jurnal_${new Date().toISOString().slice(0, 10)}.xlsx`); }

// --- 3.6. MANAJEMEN PENGGUNA ---
// (Tidak ada perubahan di bagian ini)
async function refreshUserCache() { showLoading(true); try { const response = await fetch(`${SCRIPT_URL}?action=getUsers`); const result = await response.json(); if (result.status === 'success') { cachedUsers = result.data; showStatusMessage('Data pengguna berhasil diperbarui.', 'success'); } else { showStatusMessage('Gagal memperbarui data pengguna.', 'error'); } } catch (error) { showStatusMessage('Kesalahan jaringan saat memuat pengguna.', 'error'); } finally { showLoading(false); } }
function loadUsers() { renderUsersTable(cachedUsers); }
function renderUsersTable(usersArray) { const tableBody = document.getElementById('penggunaResultsTableBody'); tableBody.innerHTML = ''; if (usersArray.length === 0) { tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada pengguna.</td></tr>'; return; } usersArray.forEach(user => { const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="Nama Lengkap">${user.nama}</td><td data-label="Username">${user.username}</td><td data-label="Peran">${user.peran}</td><td data-label="Aksi"><button class="btn btn-sm btn-secondary" onclick="editUserHandler('${user.username}')">Ubah</button><button class="btn btn-sm btn-danger" onclick="deleteUserHandler('${user.username}')">Hapus</button></td>`; tableBody.appendChild(tr); }); }
async function saveUser() { const oldUsername = document.getElementById('formUsernameOld').value; const action = oldUsername ? 'updateUser' : 'addUser'; const formData = new FormData(); formData.append('action', action); formData.append('nama', document.getElementById('formNamaPengguna').value); formData.append('username', document.getElementById('formUsername').value); formData.append('password', document.getElementById('formPassword').value); formData.append('peran', document.getElementById('formPeran').value); if (oldUsername) formData.append('oldUsername', oldUsername); if (action === 'addUser' && !formData.get('password')) return showStatusMessage('Password wajib diisi untuk pengguna baru.', 'error'); showLoading(true); try { const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); resetFormPengguna(); await refreshUserCache(); loadUsers(); } else { showStatusMessage(`Gagal: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } }
function editUserHandler(username) { const user = cachedUsers.find(u => u.username === username); if (!user) return; document.getElementById('formUsernameOld').value = user.username; document.getElementById('formNamaPengguna').value = user.nama; document.getElementById('formUsername').value = user.username; document.getElementById('formPeran').value = user.peran; document.getElementById('formPassword').value = ''; document.getElementById('formPassword').placeholder = 'Kosongkan jika tidak diubah'; document.getElementById('savePenggunaButton').textContent = 'Update Pengguna'; document.getElementById('formPengguna').scrollIntoView({ behavior: 'smooth' }); }
async function deleteUserHandler(username) { const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser')); if (loggedInUser && loggedInUser.username === username) return showStatusMessage('Anda tidak dapat menghapus akun Anda sendiri.', 'error'); if (confirm(`Apakah Anda yakin ingin menghapus pengguna '${username}'?`)) { showLoading(true); const formData = new FormData(); formData.append('action', 'deleteUser'); formData.append('username', username); try { const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); await refreshUserCache(); loadUsers(); } else { showStatusMessage(`Gagal: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } } }
function resetFormPengguna() { document.getElementById('formPengguna').reset(); document.getElementById('formUsernameOld').value = ''; document.getElementById('savePenggunaButton').textContent = 'Simpan Pengguna'; document.getElementById('formPassword').placeholder = 'Isi password baru'; }

// --- 3.7. INPUT NILAI ---
// (Tidak ada perubahan di bagian ini)
async function loadSiswaUntukNilai() { const tahunAjaran = nilaiFilterTahunAjaranEl.value; const semester = nilaiFilterSemesterEl.value; const kelas = nilaiFilterKelasEl.value; const mapel = nilaiFilterMataPelajaranEl.value; if (!tahunAjaran || !semester || !kelas || !mapel) { return showStatusMessage('Pilih semua filter (Tahun Ajaran, Semester, Kelas, Mapel) terlebih dahulu.', 'error'); } areaInputNilai.classList.remove('hidden'); jenisNilaiInput.value = ''; nilaiTableHead.innerHTML = ''; nilaiTableBody.innerHTML = '<tr><td colspan="3">Memuat siswa...</td></tr>'; const params = new URLSearchParams({ action: 'getSiswaForPresensi', tahunAjaran, semester, kelas, mapel }).toString(); try { const response = await fetch(`${SCRIPT_URL}?${params}`); const result = await response.json(); nilaiTableBody.innerHTML = ''; if (result.status === 'success' && result.data.length > 0) { jenisNilaiInput.focus(); jenisNilaiInput.oninput = () => { const jenisNilai = jenisNilaiInput.value.trim(); nilaiTableHead.innerHTML = `<tr><th>NISN</th><th>Nama Siswa</th><th>Nilai (${jenisNilai || '...'})</th></tr>`; }; jenisNilaiInput.dispatchEvent(new Event('input')); result.data.forEach(siswa => { const tr = document.createElement('tr'); tr.dataset.nisn = siswa.NISN; tr.dataset.nama = siswa.Nama; tr.innerHTML = `<td data-label="NISN">${siswa.NISN}</td><td data-label="Nama Siswa">${siswa.Nama}</td><td data-label="Nilai"><input type="number" class="nilai-input" min="0" max="100" step="1" placeholder="0-100"></td>`; nilaiTableBody.appendChild(tr); }); checkExistingNilai(); } else { nilaiTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada siswa yang cocok dengan filter.</td></tr>'; } } catch (error) { showStatusMessage('Gagal memuat siswa: ' + error.message, 'error'); } }
async function submitNilai() { const detailNilai = { tahunAjaran: nilaiFilterTahunAjaranEl.value, semester: nilaiFilterSemesterEl.value, kelas: nilaiFilterKelasEl.value, mataPelajaran: nilaiFilterMataPelajaranEl.value, jenisNilai: jenisNilaiInput.value.trim() }; if (!detailNilai.jenisNilai) { return showStatusMessage('Harap isi kolom "Jenis Penilaian" terlebih dahulu.', 'error'); } const nilaiSiswa = []; document.querySelectorAll('#nilaiTableBody tr').forEach(row => { const nilaiInput = row.querySelector('.nilai-input'); if (nilaiInput && nilaiInput.value !== '') { nilaiSiswa.push({ nisn: row.dataset.nisn, nama: row.dataset.nama, nilai: parseFloat(nilaiInput.value) }); } }); if (nilaiSiswa.length === 0) { return showStatusMessage('Tidak ada nilai yang diisi. Harap masukkan setidaknya satu nilai siswa.', 'error'); } const isUpdateMode = submitNilaiButton.dataset.mode === 'update'; const dataUntukKirim = { detail: detailNilai, nilaiSiswa: nilaiSiswa, isUpdate: isUpdateMode }; showLoading(true); try { const response = await fetch(`${SCRIPT_URL}?action=submitNilai`, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dataUntukKirim) }); const result = await response.json(); if (result.status === 'success') { showStatusMessage(result.message, 'success'); areaInputNilai.classList.add('hidden'); jenisNilaiInput.value = ''; nilaiTableHead.innerHTML = ''; nilaiTableBody.innerHTML = ''; fetch(`${SCRIPT_URL}?action=getUniqueJenisNilai`).then(res => res.json()).then(result => { if(result.status === 'success') cachedJenisNilai = result.data; }); } else { showStatusMessage(`Gagal: ${result.message}`, 'error'); } } catch (error) { showStatusMessage(`Terjadi kesalahan jaringan: ${error.message}`, 'error'); } finally { showLoading(false); } }
function showJenisNilaiSuggestions() { const query = jenisNilaiInput.value.toLowerCase(); jenisNilaiSaranEl.innerHTML = ''; if (query.length === 0) { jenisNilaiSaranEl.classList.add('hidden'); return; } const suggestions = cachedJenisNilai.filter(jenis => jenis.toLowerCase().includes(query)); if (suggestions.length > 0) { suggestions.forEach(suggestion => { const itemDiv = document.createElement('div'); itemDiv.className = 'rekomendasi-item'; itemDiv.textContent = suggestion; itemDiv.onclick = () => { jenisNilaiInput.value = suggestion; jenisNilaiSaranEl.classList.add('hidden'); jenisNilaiInput.dispatchEvent(new Event('input')); }; jenisNilaiSaranEl.appendChild(itemDiv); }); jenisNilaiSaranEl.classList.remove('hidden'); } else { jenisNilaiSaranEl.classList.add('hidden'); } }
async function checkExistingNilai() { const detailFilter = { tahunAjaran: nilaiFilterTahunAjaranEl.value, semester: nilaiFilterSemesterEl.value, kelas: nilaiFilterKelasEl.value, mapel: nilaiFilterMataPelajaranEl.value, jenisNilai: jenisNilaiInput.value.trim() }; submitNilaiButton.textContent = "Masukkan Nilai"; submitNilaiButton.dataset.mode = "insert"; submitNilaiButton.classList.remove('btn-accent'); submitNilaiButton.classList.add('btn-primary'); document.querySelectorAll('#nilaiTableBody .nilai-input').forEach(input => input.value = ''); if (!detailFilter.jenisNilai) return; const params = new URLSearchParams({ action: 'getExistingNilai', ...detailFilter }).toString(); try { const response = await fetch(`${SCRIPT_URL}?${params}`); const result = await response.json(); if (result.status === 'success' && result.data.length > 0) { showStatusMessage(`Data untuk "${detailFilter.jenisNilai}" ditemukan. Mode update aktif.`, 'info'); submitNilaiButton.textContent = "Update Nilai"; submitNilaiButton.dataset.mode = "update"; submitNilaiButton.classList.remove('btn-primary'); submitNilaiButton.classList.add('btn-accent'); const nilaiMap = new Map(result.data.map(item => [String(item.nisn), item.nilai])); document.querySelectorAll('#nilaiTableBody tr').forEach(row => { const nisn = row.dataset.nisn; if (nilaiMap.has(nisn)) { const nilaiInput = row.querySelector('.nilai-input'); nilaiInput.value = nilaiMap.get(nisn); } }); } } catch (error) { console.error("Gagal mengecek nilai yang ada:", error); } }

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
                initHistoryCascadingFilters();
                document.getElementById('riwayatTableBody').innerHTML = '<tr><td colspan="7" style="text-align: center;">Gunakan filter di atas untuk menampilkan riwayat.</td></tr>';
                document.getElementById('exportRiwayatButton').style.display = 'none';
            } else if(sectionId === 'nilaiSection') {
                initNilaiCascadingFilters();
                areaInputNilai.classList.add('hidden');
            } else if (sectionId === 'penggunaSection') {
                loadUsers();
            } else if (sectionId === 'jurnalSection') {
                loadDashboardStats();
            } else if (sectionId === 'siswaSection') {
                searchSiswa();
            }
        });
    });

    document.getElementById('refreshRiwayatButton')?.addEventListener('click', refreshRiwayatCache);
    document.getElementById('refreshSiswaButton')?.addEventListener('click', refreshSiswaCache);
    document.getElementById('refreshPenggunaButton')?.addEventListener('click', refreshUserCache);

    document.getElementById('filterTahunAjaran')?.addEventListener('change', onTahunAjaranChange);
    document.getElementById('filterSemester')?.addEventListener('change', onSemesterChange);
    document.getElementById('filterKelas')?.addEventListener('change', onKelasChange);
    document.getElementById('riwayatFilterTahunAjaran')?.addEventListener('change', onHistoryTahunAjaranChange);
    document.getElementById('riwayatFilterSemester')?.addEventListener('change', onHistorySemesterChange);
    document.getElementById('riwayatFilterKelas')?.addEventListener('change', onHistoryKelasChange);
    nilaiFilterTahunAjaranEl?.addEventListener('change', onNilaiTahunAjaranChange);
    nilaiFilterSemesterEl?.addEventListener('change', onNilaiSemesterChange);
    nilaiFilterKelasEl?.addEventListener('change', onNilaiKelasChange);
    
    document.getElementById('loadSiswaButton')?.addEventListener('click', loadSiswaForPresensi);
    document.getElementById('submitJurnalButton')?.addEventListener('click', submitJurnal);
    document.getElementById('filterRiwayatButton')?.addEventListener('click', applyRiwayatFilter);
    document.getElementById('exportRiwayatButton')?.addEventListener('click', exportRiwayatToExcel);
    document.getElementById('formSiswa')?.addEventListener('submit', (e) => { e.preventDefault(); saveSiswa(); });
    document.getElementById('resetSiswaButton')?.addEventListener('click', resetFormSiswa);
    document.getElementById('nisnSearchInput')?.addEventListener('keyup', (e) => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => searchSiswa(), 400); });
    
    // [EVENT BARU] Menambahkan event listener untuk autofill nama siswa
    document.getElementById('formNisn')?.addEventListener('blur', autofillNamaSiswa);

    document.getElementById('formPengguna')?.addEventListener('submit', (e) => { e.preventDefault(); saveUser(); });
    document.getElementById('resetPenggunaButton')?.addEventListener('click', resetFormPengguna);
    loadSiswaUntukNilaiButton?.addEventListener('click', loadSiswaUntukNilai);
    submitNilaiButton?.addEventListener('click', submitNilai);

    jenisNilaiInput?.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { showJenisNilaiSuggestions(); checkExistingNilai(); }, 400); });
    jenisNilaiInput?.addEventListener('blur', () => { setTimeout(() => jenisNilaiSaranEl.classList.add('hidden'), 200); });
}

async function initDashboardPage() {
    checkAuthentication();
    setupDashboardListeners();
    showSection('jurnalSection');
    const defaultButton = document.querySelector('.section-nav button[data-section="jurnalSection"]');
    if (defaultButton) defaultButton.classList.add('active');
    
    await Promise.all([
        initCascadingFilters(),
        initNilaiCascadingFilters(),
        loadDashboardStats(),
        preloadAllData()
    ]);
}

function initLoginPage() {
    checkAuthentication();
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.querySelector('.login-box form')?.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
    setupPasswordToggle();
}

// ====================================================================
// TAHAP 5: TITIK MASUK APLIKASI (ENTRY POINT)
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    const onDashboard = window.location.pathname.includes('dashboard.html');
    if (onDashboard) {
        if (sessionStorage.getItem('loggedInUser')) {
            initDashboardPage();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        initLoginPage();
    }
});
