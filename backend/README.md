# MOKA Backend — Modul User Management

Backend API untuk portal **MOKA (Mojang Jajaka Kabupaten Bogor)** menggunakan Express.js, PostgreSQL (Supabase), Nodemailer, Google reCAPTCHA, JWT, dan Swagger UI.

> **Ruang Lingkup Tahap 1:** Modul User Management (registrasi, verifikasi email via direct link, login, serta lupa kata sandi dengan OTP).

---

## Prasyarat

- **Node.js** v18+ (memakai `fetch` bawaan)
- **PostgreSQL / Supabase**
- **SMTP Server** (misalnya Mailtrap Sandbox untuk pengujian lokal)
- **Google reCAPTCHA** Secret Key (untuk pengujian lokal/Swagger dapat memakai Test Secret Key resmi Google)

---

## Instalasi & Konfigurasi

1. Masuk ke folder `backend` dan install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

3. Lengkapi variabel di `backend/.env`:
   - `PORT` — Port server (default `4000`)
   - `APP_BASE_URL` — Base URL server (default `http://localhost:4000`, dipakai untuk link verifikasi email & Swagger)
   - `DATABASE_URL` — Connection string PostgreSQL / Supabase Session Pooler (jika password mengandung karakter khusus seperti `@`, `#`, `/`, `:`, ubah ke format URL-encoded)
   - `DATABASE_SSL` — `true` untuk Supabase/cloud PostgreSQL, `false` untuk PostgreSQL lokal tanpa SSL
   - `JWT_SECRET` & `JWT_EXPIRES_IN` — Secret dan masa berlaku access token JWT
   - `RECAPTCHA_SECRET_KEY` & `RECAPTCHA_MIN_SCORE` — Gunakan `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` (Google Test Secret Key) untuk pengujian lokal/Swagger
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` — Konfigurasi SMTP pengiriman email

4. Jalankan skema database di PostgreSQL / Supabase SQL Editor menggunakan isi file [`db/schema.sql`](./db/schema.sql) (`users`, `email_verification_tokens`, `password_reset_otps`).

---

## Menjalankan Server

- **Mode development** (auto-reload dengan nodemon):
  ```bash
  npm run dev
  ```
- **Mode production**:
  ```bash
  npm start
  ```

Setelah berjalan:
- Health check: `GET http://localhost:4000/api/health`
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

---

## Daftar Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Cek status server |
| `POST` | `/api/auth/register` | Registrasi akun peserta + reCAPTCHA + kirim direct link verifikasi email |
| `GET` | `/api/auth/verify-email?token=...` | Verifikasi email via direct link (sekali pakai) |
| `POST` | `/api/auth/resend-verification` | Kirim ulang link verifikasi email + reCAPTCHA |
| `POST` | `/api/auth/login` | Login + reCAPTCHA (wajib sudah verifikasi email), mengembalikan JWT & objek `user` |
| `POST` | `/api/auth/forgot-password` | Kirim OTP 6 digit ke email untuk reset kata sandi + reCAPTCHA |
| `POST` | `/api/auth/verify-otp` | Verifikasi OTP 6 digit (maksimal 5 percobaan) |
| `POST` | `/api/auth/reset-password` | Simpan kata sandi baru menggunakan OTP yang telah diverifikasi |

> Detail skema request, response, dan kode status (`200`, `201`, `400`, `401`, `403`, `409`, `429`) tersedia langsung di **Swagger UI** (`/api-docs`).

---

## Struktur Folder

```text
backend/
├── db/
│   └── schema.sql            # Skema tabel & RLS PostgreSQL
├── src/
│   ├── config/               # Konfigurasi env, pool PostgreSQL, Swagger
│   ├── controllers/          # Handler request/response HTTP
│   ├── middlewares/          # Rate limiter & global error handler
│   ├── routes/               # Definisi rute API & anotasi OpenAPI
│   ├── services/             # Logika bisnis autentikasi & transaksi DB
│   ├── utils/                # Helper crypto, mailer, reCAPTCHA, HttpError
│   ├── validators/           # Validasi & normalisasi input request
│   ├── app.js                # Setup aplikasi Express & Swagger UI
│   └── server.js             # Entry point server & pengecekan koneksi DB
├── .env.example              # Template environment variable
└── package.json
```
