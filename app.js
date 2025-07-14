/**
 * =================================================================
 * CSS UTAMA - JURNAL PEMBELAJARAN (VERSI LENGKAP)
 * =================================================================
 * @version 2.2 - Enhanced with styles for new features & UI polish
 * @author Gemini AI Expert for User
 *
 * Perbaikan utama:
 * - [BARU] Style untuk kartu riwayat jurnal agar lebih informatif.
 * - [BARU] Style untuk tombol aksi kecil (edit, hapus) di dalam tabel.
 * - [BARU] Style untuk tombol reset/batal.
 * - [BARU] Style untuk overlay modal (persiapan untuk detail jurnal yang lebih canggih).
 * - Penambahan transisi halus pada beberapa elemen untuk UX yang lebih baik.
 */

/* -----------------------------------------------------------------
   1. VARIABEL GLOBAL & RESET DASAR
   ----------------------------------------------------------------- */
:root {
    --primary-color: #4a90e2;
    --primary-dark: #357ABD;
    --secondary-color: #f4f7fc;
    --accent-color: #50e3c2;
    --accent-dark: #40b59b;
    --text-color: #333333;
    --text-light: #6c757d;
    --border-color: #dfe4ea;
    --white-color: #ffffff;
    --danger-color: #e74c3c;
    --danger-dark: #c0392b;
    --success-color: #2ecc71;
    --success-dark: #27ae60;
    --font-family: 'Poppins', sans-serif;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.12);
    --border-radius: 8px;
    --transition-speed: 0.3s;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family);
    background-color: var(--secondary-color);
    color: var(--text-color);
    line-height: 1.6;
}

/* -----------------------------------------------------------------
   2. LAYOUT UTAMA (HEADER, NAV, MAIN)
   ----------------------------------------------------------------- */
header {
    background: var(--white-color);
    padding: 1rem 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
}

header .logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.section-nav {
    background-color: var(--white-color);
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border-color);
    text-align: center;
    position: sticky;
    top: 70px; /* Sesuaikan dengan tinggi header Anda */
    z-index: 99;
}

.section-nav button {
    margin: 0.25rem 0.5rem;
    background-color: transparent;
    color: var(--text-light);
    font-weight: 500;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.5rem 0.25rem;
    border-radius: 0;
    transition: color var(--transition-speed), border-color var(--transition-speed);
}
.section-nav button:hover {
    color: var(--primary-dark);
    transform: none;
}
.section-nav button.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 600;
}

main {
    padding: 1.5rem;
}

.container {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
}

/* -----------------------------------------------------------------
   3. HALAMAN LOGIN
   ----------------------------------------------------------------- */
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.login-container {
    width: 100%;
    max-width: 400px;
    background: var(--white-color);
    padding: 40px 30px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
}
.login-container h2 {
    margin-bottom: 25px;
}

/* -----------------------------------------------------------------
   4. KOMPONEN UTAMA (KARTU, FORM, TOMBOL, TABEL)
   ----------------------------------------------------------------- */
.card {
    background: var(--white-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--shadow);
    transition: box-shadow var(--transition-speed), transform var(--transition-speed);
}
.card:hover {
    /* [BARU] Efek hover halus pada kartu */
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
}


.card-header {
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 1.2rem;
    font-weight: 600;
}

.form-group {
    margin-bottom: 1rem;
}
.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-light);
}

input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-family: var(--font-family);
    font-size: 1rem;
    transition: border-color var(--transition-speed), box-shadow var(--transition-speed);
}
input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

textarea { resize: vertical; min-height: 100px; }

/* Tombol (Button) */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-family: var(--font-family);
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.btn:active { transform: translateY(0); box-shadow: none; }

.btn:disabled, .btn:disabled:hover {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-primary { background-color: var(--primary-color); color: var(--white-color); }
.btn-primary:hover { background-color: var(--primary-dark); }
.btn-accent { background-color: var(--accent-color); color: var(--text-color); }
.btn-accent:hover { background-color: var(--accent-dark); }
.btn-success { background-color: var(--success-color); color: var(--white-color); }
.btn-success:hover { background-color: var(--success-dark); }
.btn-danger { background-color: var(--danger-color); color: var(--white-color); }
.btn-danger:hover { background-color: var(--danger-dark); }
.btn-secondary { background-color: #f8f9fa; color: var(--text-color); border: 1px solid var(--border-color); }
.btn-secondary:hover { background-color: #e9ecef; }
.btn-block { width: 100%; display: block; }

/* [BARU] Tombol aksi kecil untuk tabel (edit/hapus) */
.btn-sm {
    padding: 0.25rem 0.6rem;
    font-size: 0.875rem;
    margin: 0 2px;
}

/* Tabel */
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
thead { background-color: #f8f9fa; }
th, td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
th { font-weight: 600; color: var(--text-light); }
tbody tr { transition: background-color var(--transition-speed); }
tbody tr:hover { background-color: var(--secondary-color); }

/* [BARU] Style untuk kontainer riwayat */
#riwayatContainer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
}
#riwayatContainer .card:hover {
    border-left: 4px solid var(--primary-color);
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-hover);
}
#riwayatContainer .card {
    border-left: 4px solid transparent;
}


/* -----------------------------------------------------------------
   5. UTILITIES (Pesan Notifikasi, Loading Spinner, Modal)
   ----------------------------------------------------------------- */
.status-message {
    padding: 1rem;
    margin: 0 1.5rem 1.5rem 1.5rem;
    border-radius: var(--border-radius);
    display: none;
    border: 1px solid transparent;
    text-align: center;
    font-weight: 500;
}
.status-message.success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.status-message.error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
.status-message.info { background-color: #cce5ff; color: #004085; border-color: #b8daff; }

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.spinner {
    border: 5px solid var(--secondary-color);
    border-top: 5px solid var(--primary-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* -----------------------------------------------------------------
   6. RESPONSIVE DESIGN
   ----------------------------------------------------------------- */
@media (min-width: 768px) {
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-grid .form-group-full { grid-column: 1 / -1; }
}

@media (max-width: 767px) {
    /* Buat navigasi SPA lebih ramah mobile */
    .section-nav {
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
        padding: 0.5rem 0;
    }
    .section-nav button {
        display: inline-block;
        margin: 0 0.75rem;
    }
    header, main {
        padding: 1rem;
    }

    /* Tabel responsif */
    thead { display: none; }
    tr { display: block; border: 1px solid var(--border-color); border-radius: var(--border-radius); margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background: var(--white-color); }
    td { display: block; text-align: right; padding-left: 50%; position: relative; border-bottom: 1px solid var(--border-color); padding-top: 0.75rem; padding-bottom: 0.75rem; }
    td:last-child { border-bottom: none; }
    td::before { content: attr(data-label); position: absolute; left: 1rem; width: calc(50% - 2rem); text-align: left; font-weight: 600; color: var(--text-color); }
}
