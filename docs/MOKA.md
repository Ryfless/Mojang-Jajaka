# MOKA | Panduan Prototipe Frontend

## Arsitektur Aplikasi

Aplikasi ini berjalan sepenuhnya di sisi frontend menggunakan **React 19 + TypeScript + Vite + Tailwind CSS v4** dengan data dummy lokal yang disimpan di `localStorage` (`src/services/moka-mock-service.ts` dan `src/data/dummy-moka.ts`). Tidak ada backend API server, autentikasi server, maupun konfigurasi database SQL.

## Peta Aplikasi

- `/`: halaman masuk bersama dengan gambar cover utuh `/images/Cover.png` tampil menyeluruh tanpa terpotong (`object-contain`) di sisi kiri (dapat diubah melalui Pengaturan) dan panel form bersih tanpa logo/tahun/ikon gembok atas serta tanpa kartu akses cepat demo; verifikasi login dilewati.
- `/daftar`: registrasi akun peserta simulasi; langsung membuat data draft dan masuk ke wizard pendaftaran, atau menampilkan pemberitahuan penutupan serta menonaktifkan pendaftaran jika **Batas akhir pendaftaran** sudah terlewati.
- `/peserta`: ruang peserta dengan pemilih skenario uji coba:
  - Peserta berstatus `draft` langsung membuka **wizard alur pendaftaran 3 langkah** (`01 Formulir & persyaratan` -> `02 Upload dokumen` -> `03 Pratinjau & kirim`) tanpa tombol keluar selama pendaftaran belum dikirim. Jika melewati batas pendaftaran, draft ikut terkunci dari pengubahan maupun pengiriman.
  - Setelah pendaftaran dikirim, seluruh data dan berkas peserta bersifat **baca saja (read-only)** tanpa fitur revisi. Dashboard menampilkan kartu hasil seleksi (hitung mundur 3-2-1), ringkasan status administrasi, stepper progres, daftar berkas terkirim (dengan pratinjau modal + mode **Fullscreen** dan kontrol Zoom), ringkasan data diri, serta info tahap berikutnya.
- `/panitia`: ruang kerja panitia berisi dashboard statistik, tab penuh **Mojang** / **Jajaka** dengan warna utama untuk tab terpilih, direktori peserta modern tanpa filter tanggal (`List` & `Grid` 4-5 kolom di desktop), tinjauan dokumen sekali klik **Tinjau** (beserta mode **Fullscreen** & Zoom untuk PDF/gambar), keputusan administrasi (**Lolos** atau **Tidak lolos**), **Manajemen jadwal** dengan header tetap + tab konsisten (**Jadwal interview** & **Jadwal hasil & batas pendaftaran**), serta **Pengaturan** tema, logo, dan gambar cover dinamis.

## Alur Peserta

Masuk / daftar (tanpa verifikasi) -> wizard pendaftaran (`01` kategori, data diri termasuk tinggi dan **berat badan**, serta persyaratan -> `02` unduh template referensi & **Template CV**, lalu unggah lima dokumen wajib dan sertifikat opsional -> `03` pratinjau & kirim pendaftaran) -> dashboard peserta read-only (*Dashboard*, *Status & verifikasi*, *Dokumen & template* untuk meninjau berkas dalam modal maupun mode **Fullscreen** dan mengunduh salinan berkas).

Saat jadwal pembukaan hasil tiba, muncul tombol **Lihat hasil seleksi**. Peserta menekannya -> hitung mundur **3, 2, 1** -> status hasil administrasi dibuka beserta jadwal interview pribadi bagi peserta berstatus **Lolos administrasi**.

### Template Dokumen & Template CV

- `/templates/surat-izin-orang-tua-dummy.pdf` (unduh saja untuk referensi)
- `/templates/formulir-pendaftaran-dummy.pdf` (unduh saja untuk referensi)
- `/templates/template-cv-dummy.pdf` (dapat diunduh terlebih dahulu sebelum mengunggah CV pada langkah 02)

Seluruhnya berlabel **DUMMY (BUKAN TEMPLATE RESMI)** untuk kebutuhan pengujian prototipe frontend.

## Alur Panitia & Pengaturan Tema Dinamis

Masuk ke `/panitia` (langsung via URL, tombol akses cepat, atau Role Switcher) -> dashboard -> pilih tab penuh **Mojang** atau **Jajaka** -> cari/filter peserta -> detail dan tinjauan dokumen (tekan **Tinjau** untuk melihat berkas sekaligus menandai `Sudah diperiksa`, serta tombol **Fullscreen** untuk pratinjau penuh layar dengan Zoom) -> keputusan administrasi (**Lolos administrasi** atau **Tidak lolos administrasi** dengan alasan wajib). Peserta berstatus **Lolos administrasi** otomatis muncul di dropdown jadwal interview dan dapat membuka hasil seleksi pada waktunya tanpa perlu panel penetapan pemenang terpisah.

Menu **Manajemen jadwal** menampilkan satu header `PageTitle` di atas dan tab konsisten di bawahnya (`Jadwal interview` | `Jadwal hasil & batas pendaftaran`). Jadwal interview bersifat umum untuk seluruh peserta berstatus **Lolos administrasi** tanpa memilih peserta perorangan.

Menu **Pengaturan** pada sidebar panitia memungkinkan panitia memilih preset tema warna, menyesuaikan palet warna kustom (`brand`, `cocoa`, `canvas`, `paper`, `accent`), mengunggah/mereset **Logo aplikasi**, mengunggah/mereset **Gambar cover penuh halaman login/register** (bawaan `/images/Cover.png`), serta mengatur tahun & catatan periode secara dinamis via CSS custom properties (`src/lib/theme.ts`).

## Simulasi Data & Pengujian Lokal

- `src/types/moka.ts`: definisi tipe TypeScript (`MokaUser`, `Application`, `MokaDocument`, `Interview`, `ProfilePhoto`, `ReviewHistory`, `MokaSetting`, `ThemePreferences`).
- `src/data/dummy-moka.ts`: dataset awal mencakup 10 peserta (5 Mojang & 5 Jajaka dengan data tinggi dan berat badan), jadwal interview, riwayat pemeriksaan, batas pendaftaran, dan jadwal pembukaan hasil.
- `src/services/moka-mock-service.ts`: menangani seluruh aksi CRUD simulasi di `localStorage` (`moka_frontend_state_v5`), kompresi foto profil & gambar branding via `<canvas>`, pencatatan `reviewHistory`, penguncian `registrationDeadline`, serta `resetMockData()`.

MOKA Assistant memakai aturan pencocokan jawaban terbatas berdasarkan brief, bukan model AI eksternal. AI CV Assist menampilkan ringkasan, kriteria, bobot, dan skor `78,25/100` dengan label jelas **Simulasi / Contoh dummy**, tidak disimpan sebagai penilaian peserta dan tidak dipakai untuk keputusan kelulusan.
