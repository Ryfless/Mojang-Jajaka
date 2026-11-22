const rateLimit = require('express-rate-limit');

const build = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
  });

/** Umum untuk seluruh /api/auth. */
const authLimiter = build(15, 100, 'Terlalu banyak permintaan, silakan coba lagi nanti');

/** Login: cegah brute force password. */
const loginLimiter = build(15, 10, 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit');

/** Register. */
const registerLimiter = build(60, 10, 'Terlalu banyak pendaftaran dari jaringan ini, coba lagi nanti');

/** Endpoint yang mengirim email (resend verifikasi, forgot password). */
const emailLimiter = build(15, 5, 'Terlalu banyak permintaan pengiriman email, coba lagi dalam 15 menit');

/** Verifikasi OTP & reset password. */
const otpLimiter = build(15, 15, 'Terlalu banyak percobaan OTP, coba lagi dalam 15 menit');

module.exports = { authLimiter, loginLimiter, registerLimiter, emailLimiter, otpLimiter };
