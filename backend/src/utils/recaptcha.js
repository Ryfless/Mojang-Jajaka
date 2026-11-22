const env = require('../config/env');
const HttpError = require('./httpError');

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifikasi token reCAPTCHA ke Google (v2 / v3).
 * Melempar HttpError 400 jika token kosong, 403 jika ditolak Google.
 */
const verifyRecaptcha = async (token, remoteIp) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new HttpError(400, 'Validasi gagal', { recaptchaToken: 'Token reCAPTCHA wajib diisi' });
  }

  const params = new URLSearchParams({ secret: env.recaptchaSecretKey, response: token.trim() });
  if (remoteIp) params.append('remoteip', remoteIp);

  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(8000),
    });
    data = await res.json();
  } catch (err) {
    console.error('[recaptcha] Gagal menghubungi Google:', err.message);
    throw new HttpError(503, 'Layanan verifikasi reCAPTCHA sedang tidak tersedia, coba lagi');
  }

  if (!data.success) {
    throw new HttpError(403, 'Verifikasi reCAPTCHA gagal', {
      recaptchaToken: (data['error-codes'] || []).join(', ') || 'invalid',
    });
  }

  // reCAPTCHA v3 mengembalikan score; v2 / test key tidak.
  if (typeof data.score === 'number' && data.score < env.recaptchaMinScore) {
    throw new HttpError(403, 'Verifikasi reCAPTCHA gagal (skor terlalu rendah)');
  }

  return data;
};

module.exports = { verifyRecaptcha };
