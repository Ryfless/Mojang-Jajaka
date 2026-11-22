# MOKA | Portal Pendaftaran & Seleksi Mojang Jajaka Kabupaten Bogor (Frontend)

Aplikasi web frontend-only berbasis **React 19 + TypeScript + Vite + Tailwind CSS v4** untuk portal pendaftaran dan seleksi **Mojang Jajaka (MOKA) Kabupaten Bogor**.

Seluruh alur berjalan penuh di browser menggunakan data dummy interaktif (`localStorage`), tanpa backend server, tanpa konfigurasi SQL/database, dan melewati verifikasi login.

## Teknologi Utama

- **React 19** + **TypeScript** (`strict: true`)
- **Vite 8** (`@vitejs/plugin-react`)
- **React Router DOM v7** (`BrowserRouter`)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Lucide React** (ikonografi)
- **PDF.js** (`pdfjs-dist` + `/public/pdf.worker.min.mjs`) untuk pratinjau dokumen PDF langsung di browser
- **ESLint** (flat config) & **oxfmt**

## Menjalankan Proyek

```bash
# 1. Instalasi dependensi
npm install

# 2. Menjalankan dev server Vite
npm run dev

# 3. Typecheck TypeScript
npm run typecheck

# 4. Linting ESLint
npm run lint

# 5. Build produksi ke folder dist/
npm run build

# 6. Pratinjau hasil build produksi
npm run preview
```

## Peta Rute

| Rute | Halaman | Keterangan |
|---|---|---|
| `/` | Halaman Masuk | Panel kiri menampilkan 1 gambar cover utuh tanpa terpotong (`/images/Cover.png` secara default, dinamis via Pengaturan) dan panel kanan form login ringkas tanpa logo/tahun/ikon gembok atas dan tanpa kartu akses cepat |
| `/daftar` | Halaman Registrasi | Pembuatan akun peserta simulasi langsung menuju wizard pendaftaran (otomatis terkunci saat **Batas akhir pendaftaran** terlewati) |
| `/peserta` | Ruang Peserta | Wizard 3 langkah (Draft tanpa tombol keluar, terkunci jika melewati batas pendaftaran), lalu Dashboard Peserta read-only (buka hasil seleksi 3-2-1, ringkasan data diri, checklist berkas + pratinjau/Fullscreen dengan kontrol Zoom, jadwal interview, dan dokumen) |
| `/panitia` | Ruang Panitia | Dashboard statistik, tab penuh **Mojang / Jajaka**, direktori peserta modern tanpa filter tanggal (grid 4-5 card per baris di desktop, responsif mobile), tinjauan dokumen sekali klik **Tinjau** + mode **Fullscreen** & Zoom, keputusan administrasi (Lolos / Tidak lolos), **Manajemen jadwal** (jadwal interview & jadwal hasil/batas pendaftaran), dan **Pengaturan** tema/logo/cover dinamis |

## Fitur & Kontrol Simulasi Frontend

- **Tanpa Verifikasi Login**: Submit form di `/` maupun `/daftar` menerima input apa saja (atau email `panitia@...` untuk masuk ke Ruang Panitia), dan `/peserta` serta `/panitia` juga dapat diakses langsung melalui URL.
- **Cover Utuh `/images/Cover.png` Login/Register**: Panel kiri pada `/` dan `/daftar` menampilkan `/images/Cover.png` secara menyeluruh tanpa terpotong (`object-contain`, kolom menyesuaikan rasio gambar) dan tetap dapat diganti atau di-reset melalui menu **Pengaturan** panitia.
- **Batas Akhir Pendaftaran & Pembukaan Hasil (WIB)**: Panitia mengatur **Batas akhir pendaftaran** (`registrationDeadline`) untuk mengunci pendaftaran baru di `/daftar` serta tombol simpan/unggah/kirim pada wizard peserta draft, dan mengatur **Pembukaan hasil seleksi** (`selectionReleaseAt`) untuk membuka modal hasil 3-2-1.
- **Wizard Pendaftaran (Tanpa Revisi & Tanpa Tombol Keluar)**:
  - Peserta berstatus `draft` berada di halaman wizard 3 langkah (`01 Formulir & persyaratan` dengan tinggi & **berat badan**, `02 Upload dokumen` lengkap dengan **unduh Template CV** sebelum mengunggah CV, `03 Pratinjau & kirim`) tanpa tombol keluar sebelum pengiriman selesai.
  - Setelah pendaftaran dikirim, halaman peserta bersifat **baca saja (read-only)**: berkas hanya bisa ditinjau (termasuk mode layar penuh + Zoom) atau diunduh tanpa opsi revisi/ubah berkas.
- **Tinjauan Dokumen Sekali Klik & Mode Fullscreen**:
  - Pada Detail Peserta di Panitia, setiap kartu dokumen hanya menampilkan tombol **Tinjau**. Menekan **Tinjau** langsung membuka pratinjau dan otomatis menandai dokumen tersebut dari `Belum diperiksa` menjadi `Sudah diperiksa`.
  - Keputusan **Lolos administrasi** aktif setelah seluruh 5 dokumen wajib ditinjau dan kotak konfirmasi persyaratan dicentang.
  - Pratinjau dokumen bagi Peserta maupun Panitia menyediakan tombol **Fullscreen** untuk membuka tampilan penuh layar dengan kontrol Zoom (`-`, `100%`, `+`), navigasi halaman PDF, tombol unduh, serta tombol keluar/`Esc`.
- **Direktori Peserta & Manajemen Jadwal Panitia**:
  - Tab **Mojang** dan **Jajaka** dibuat penuh 2 kolom dengan tab aktif memakai warna utama (`brand`).
  - Menu sidebar **Manajemen jadwal** menampilkan satu header `PageTitle` tetap di atas diikuti tab **Jadwal interview** serta **Jadwal hasil & batas pendaftaran** di bawahnya agar posisi tab konsisten saat berpindah tab.
- **Pengaturan Tema, Cover & Logo Dinamis (Panitia)**: Menu **Pengaturan** di sidebar `/panitia` menyediakan preset tema, color picker kustom, unggah/reset Logo aplikasi, unggah/reset Gambar Cover utuh halaman Login/Registrasi, serta pengaturan tahun/catatan periode yang langsung diterapkan ke seluruh halaman.
- **Role Switcher & Pemilih Skenario**: Gunakan kontrol di sidebar/header untuk berpindah **Peserta / Panitia**, memilih skenario peserta (*Lolos & Buka Hasil*, *Menunggu Verifikasi*, *Tidak Lolos Administrasi*, *Draft / Wizard 3 Langkah*), atau menekan **Reset data dummy** (`localStorage` key `moka_frontend_state_v5`).

## Struktur Folder

```text
public/
  images/          # Cover.png bawaan & logo MOKA
  samples/         # Sampel ilustrasi SVG pas foto & foto 4R dummy
  templates/       # Template PDF dummy unduhan (Surat Izin, Formulir, Template CV)
  pdf.worker.min.mjs
src/
  components/moka/ # Komponen UI domain MOKA (auth, workspace, participant, committee, theme-settings, file-preview, pdf-preview, assistant)
  data/            # Dataset awal dummy (10 peserta Mojang & Jajaka, jadwal, riwayat, pengaturan default)
  lib/             # Aturan domain, tema dinamis, kebijakan waktu WIB, helper checklist & filter direktori
  pages/           # Halaman SPA untuk react-router-dom
  services/        # Mock service client-side & persistensi localStorage
  styles/          # Token CSS dinamis & styling Tailwind CSS v4
  types/           # Definisi tipe TypeScript domain MOKA
  App.tsx          # Konfigurasi routing SPA
  main.tsx         # Entry point React (menerapkan tema tersimpan saat boot)
```
