# Panduan Backend Developer | Modul User Management (MOKA)

Dokumen ini menjadi acuan kerja untuk backend developer dalam membangun fondasi backend portal **MOKA (Mojang Jajaka Kabupaten Bogor)** secara bertahap.

> **Fokus Tahap Pertama:** Kerjakan **khusus modul User Management terlebih dahulu** (konfigurasi database, Register + reCAPTCHA + verifikasi email direct link, Login + reCAPTCHA, dan Lupa Password dengan OTP). **Jangan dulu membuat endpoint atau fitur aplikasi lain** (seperti formulir pendaftaran peserta, unggah dokumen, penilaian panitia, atau jadwal interview), dan **tidak perlu langsung integrasi dengan frontend**. Seluruh pengujian fungsi dan endpoint dilakukan mandiri melalui **Swagger / OpenAPI**.

---

## 1. Alur Kerja Git, Branch, Commit, dan Pull Request

Repository `https://github.com/Ryfless/Mojang-Jajaka` menerapkan **Repository Ruleset** pada branch `main` dan `dev`:
- Push langsung ke branch `main` maupun `dev` **diblokir** (selain pemilik repository).
- Setiap perubahan wajib melalui **Pull Request (PR)** ke branch **`dev`** dengan minimal **1 approving review** dan seluruh komentar review berstatus *resolved*.

### Langkah Wajib Sebelum Mulai Ngoding
Agar tidak terjadi merge conflict, **selalu lakukan `pull` dari `origin/dev` terlebih dahulu** sebelum membuat branch baru:

```bash
# 1. Pastikan berada di branch dev dan ambil pembaruan terbaru dari origin
git checkout dev
git pull origin dev

# 2. Buat branch baru dari dev dengan awalan feat/ (atau fix/ untuk perbaikan)
git checkout -b feat/backend-user-management
```

### Aturan Penamaan Branch & Commit
- **Branch baru**: Awali dengan `feat/` untuk fitur baru atau `fix/` untuk perbaikan bug.
  - Contoh: `feat/backend-db-setup`, `feat/backend-auth-recaptcha`, `fix/auth-otp-expiry`.
- **Pesan Commit**: Awali dengan `feat/` atau `fix/`, diikuti judul singkat dan deskripsi yang mudah dipahami.
  - Contoh commit fitur:
    ```bash
    git commit -m "feat/db-auth-schema: tambah konfigurasi database dan skema user management" -m "Menambahkan koneksi database, migrasi tabel users, token verifikasi email, serta OTP reset password."
    ```
  - Contoh commit perbaikan:
    ```bash
    git commit -m "fix/email-verification-token: perbaiki validasi kedaluwarsa link verifikasi" -m "Menolak token yang sudah lewat batas waktu atau sudah pernah digunakan dan mengembalikan status HTTP 400."
    ```
- **Push & Pull Request**:
  ```bash
  git push -u origin feat/backend-user-management
  ```
  Setelah push, buka GitHub dan buat **Pull Request** dengan base branch **`dev`** (bukan `main`).

---

## 2. Ruang Lingkup Pekerjaan (User Management Saja)

| Termasuk di Tahap Ini | Belum Dikerjakan di Tahap Ini |
|---|---|
| Konfigurasi koneksi & migrasi database | Modul formulir pendaftaran & persyaratan peserta |
| Endpoint Register + Google reCAPTCHA | Modul unggah/tinjau dokumen & template CV |
| Pengiriman email verifikasi (direct link) | Modul direktori peserta & keputusan administrasi panitia |
| Endpoint verifikasi email & kirim ulang link | Modul manajemen jadwal interview & hasil seleksi |
| Endpoint Login + Google reCAPTCHA | Integrasi API backend ke kode frontend React |
| Endpoint Lupa Password + OTP via email + Reset Password | Modul pengaturan tema/logo/cover |
| Dokumentasi & pengujian via Swagger UI | |

---

## 3. Konfigurasi Database & Rancangan Skema Minimal

Gunakan konfigurasi berbasis environment variable (`.env`, pastikan tidak ikut ter-commit ke Git; file `.env*` sudah masuk `.gitignore`):

```env
PORT=4000
APP_BASE_URL=http://localhost:4000
DATABASE_URL=postgresql://user:password@localhost:5432/moka_db

# JWT / Session
JWT_SECRET=ganti_dengan_secret_yang_kuat
JWT_EXPIRES_IN=1d

# Google reCAPTCHA (v2 atau v3)
RECAPTCHA_SECRET_KEY=isi_secret_key_recaptcha
RECAPTCHA_MIN_SCORE=0.5

# SMTP / Email Service (untuk verifikasi link & OTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=isi_password_smtp
MAIL_FROM="MOKA Kabupaten Bogor <no-reply@example.com>"
```

### Rancangan Tabel Minimal

1. **`users`** (selaras dengan kontrak `MokaUser` di frontend: `id`, `name`, `email`, `role`):
   - `id` (UUID / string primary key)
   - `name` (`VARCHAR(150)`, not null)
   - `email` (`VARCHAR(254)`, unique, not null, simpan lowercase)
   - `password_hash` (`TEXT`, not null, hash menggunakan `bcrypt` atau `argon2`)
   - `role` (`VARCHAR(20)`, default `'participant'`, nilai: `'participant'` | `'committee'`)
   - `email_verified_at` (`TIMESTAMP`, nullable; `NULL` berarti belum terverifikasi dan belum boleh login)
   - `created_at`, `updated_at` (`TIMESTAMP`)

2. **`email_verification_tokens`** (untuk direct link verifikasi email saat register):
   - `id` (UUID primary key)
   - `user_id` (FK -> `users.id`, on delete cascade)
   - `token_hash` (`VARCHAR(255)`, unique, not null; simpan hasil hash SHA-256 dari token mentah)
   - `expires_at` (`TIMESTAMP`, not null; misal 15-60 menit)
   - `used_at` (`TIMESTAMP`, nullable; isi saat link sudah diklik agar hanya berlaku 1 kali)
   - `created_at` (`TIMESTAMP`)

3. **`password_reset_otps`** (untuk alur lupa password dengan OTP):
   - `id` (UUID primary key)
   - `user_id` (FK -> `users.id`, on delete cascade)
   - `otp_hash` (`VARCHAR(255)`, not null; simpan hash dari 6 digit OTP)
   - `attempts` (`INT`, default `0`; batasi maksimal misal 5 kali salah)
   - `expires_at` (`TIMESTAMP`, not null; misal 5-10 menit)
   - `verified_at` (`TIMESTAMP`, nullable)
   - `used_at` (`TIMESTAMP`, nullable)
   - `created_at` (`TIMESTAMP`)

---

## 4. Spesifikasi Alur & Endpoint API

### A. Register + Google reCAPTCHA + Direct Link Verifikasi Email
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Siti Rahma Putri",
    "email": "siti.rahma@email.com",
    "password": "PasswordKuat123!",
    "confirmPassword": "PasswordKuat123!",
    "recaptchaToken": "token_dari_client_atau_bypass_di_swagger_dev"
  }
  ```
- **Aturan Proses**:
  1. Validasi seluruh field (format email, panjang minimal password, kecocokan `password` dan `confirmPassword`).
  2. Verifikasi `recaptchaToken` ke API Google (`https://www.google.com/recaptcha/api/siteverify`). Jika tidak valid, tolak dengan HTTP `400` / `403`.
  3. Pastikan `email` belum terdaftar (HTTP `409` jika sudah ada).
  4. Hash password dan simpan user ke tabel `users` dengan `email_verified_at = NULL` dan `role = 'participant'`.
  5. Buat token acak kriptografis (`crypto.randomBytes(32)`), simpan hash-nya ke `email_verification_tokens` dengan masa berlaku terbatas.
  6. Kirim email ke alamat peserta berisi **direct link** verifikasi:
     `{APP_BASE_URL}/api/auth/verify-email?token=<token_mentah>`
     (Aturan ini memastikan email yang diinput benar-benar valid dan dimiliki oleh pendaftar).
  7. Kembalikan HTTP `201` dengan pesan agar pengguna mengecek kotak masuk email untuk mengklik link verifikasi.

### B. Verifikasi Direct Link Email & Kirim Ulang Link
- **Endpoint**: `GET /api/auth/verify-email?token=<token_mentah>`
- **Aturan Proses**:
  1. Hash parameter `token` dan cari di `email_verification_tokens`.
  2. Validasi token ada, belum pernah digunakan (`used_at IS NULL`), dan belum kedaluwarsa (`expires_at > NOW()`).
  3. Tandai `used_at = NOW()` pada token dan perbarui `users.email_verified_at = NOW()`.
  4. Kembalikan respons sukses (HTTP `200`) yang menyatakan email berhasil diverifikasi dan akun siap login.
- **Endpoint Tambahan**: `POST /api/auth/resend-verification`
  - Menerima `{ "email": "...", "recaptchaToken": "..." }`, membatasi frekuensi pengiriman (rate limit), membatalkan token lama, lalu mengirim ulang direct link baru jika akun belum terverifikasi.

### C. Login + Google reCAPTCHA
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "siti.rahma@email.com",
    "password": "PasswordKuat123!",
    "recaptchaToken": "token_dari_recaptcha"
  }
  ```
- **Aturan Proses**:
  1. Verifikasi `recaptchaToken` ke Google reCAPTCHA API.
  2. Cari user berdasarkan `email` dan verifikasi password hash (gunakan pesan error umum `"Email atau kata sandi salah"` jika tidak cocok agar tidak membocorkan akun terdaftar).
  3. Cek `email_verified_at`: **jika masih `NULL`, tolak login** (HTTP `403`) dengan pesan agar memverifikasi email melalui link yang dikirim terlebih dahulu.
  4. Terbitkan access token (JWT) beserta data ringkas user (`id`, `name`, `email`, `role`).

### D. Lupa Password dengan OTP
1. **`POST /api/auth/forgot-password`**
   - Body: `{ "email": "...", "recaptchaToken": "..." }`.
   - Verifikasi reCAPTCHA. Jika email terdaftar dan terverifikasi, buat **OTP 6 digit acak** (`crypto.randomInt(100000, 999999)`), simpan hash-nya di `password_reset_otps` (kedaluwarsa 5-10 menit), lalu kirim OTP ke email user.
   - Selalu kembalikan respons generik HTTP `200` (misal *"Jika email terdaftar, kode OTP telah dikirim."*) untuk mencegah email enumeration.
2. **`POST /api/auth/verify-otp`**
   - Body: `{ "email": "...", "otp": "123456" }`.
   - Cek kecocokan hash OTP, masa berlaku, dan batas percobaan (`attempts < 5`). Jika salah, naikkan `attempts`; jika benar, tandai `verified_at = NOW()` dan keluarkan `resetToken` sementara (atau tandai OTP siap dipakai untuk reset).
3. **`POST /api/auth/reset-password`**
   - Body: `{ "email": "...", "otp": "123456", "newPassword": "...", "confirmPassword": "..." }` (atau menggunakan `resetToken`).
   - Pastikan OTP valid/terverifikasi dan belum dipakai (`used_at IS NULL`), perbarui `users.password_hash`, dan tandai `used_at = NOW()`.

---

## 5. Pengujian Mandiri Menggunakan Swagger / OpenAPI

Karena integrasi frontend belum dilakukan pada tahap ini, seluruh pengujian dilakukan via **Swagger UI** (misalnya pada `http://localhost:4000/api-docs`):

1. **Setup Swagger**: Daftarkan seluruh skema request/response dan kode status (`200`, `201`, `400`, `401`, `403`, `409`, `429`) pada tag `Auth / User Management`.
2. **Tips Uji reCAPTCHA di Lingkungan Lokal/Swagger**:
   - Gunakan **Google reCAPTCHA Test Keys** resmi dari dokumentasi Google saat pengujian di local/Swagger agar validasi ke endpoint Google `siteverify` tetap berjalan nyata tanpa perlu UI frontend.
3. **Checklist Skenario Uji di Swagger**:
   - [ ] `POST /api/auth/register` gagal jika reCAPTCHA tidak valid atau email duplikat.
   - [ ] `POST /api/auth/register` berhasil mengirim email berisi direct link verifikasi ke mailtrap / SMTP dev.
   - [ ] `POST /api/auth/login` ditolak (`403`) sebelum direct link verifikasi email diklik.
   - [ ] `GET /api/auth/verify-email?token=...` berhasil memverifikasi akun, dan gagal jika token dipakai ulang atau sudah kedaluwarsa.
   - [ ] `POST /api/auth/login` berhasil (`200`) setelah email terverifikasi dan mengembalikan JWT + objek `user`.
   - [ ] `POST /api/auth/forgot-password` mengirim OTP 6 digit ke email.
   - [ ] `POST /api/auth/verify-otp` menolak OTP salah dan membatasi percobaan berlebih.
   - [ ] `POST /api/auth/reset-password` berhasil mengganti password, OTP tidak bisa dipakai ulang, dan login dengan password baru berhasil.
