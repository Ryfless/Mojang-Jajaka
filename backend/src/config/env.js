const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const required = ['DATABASE_URL', 'JWT_SECRET', 'RECAPTCHA_SECRET_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Environment variable wajib belum diisi: ${missing.join(', ')}`);
}

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

module.exports = {
  port: toInt(process.env.PORT, 4000),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:4000').replace(/\/$/, ''),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
  recaptchaMinScore: Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5'),
  smtp: {
    host: process.env.SMTP_HOST,
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  mailFrom: process.env.MAIL_FROM || 'MOKA Kabupaten Bogor <no-reply@moka.local>',
  emailVerificationExpiresMinutes: toInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES, 60),
  otpExpiresMinutes: toInt(process.env.OTP_EXPIRES_MINUTES, 10),
  otpMaxAttempts: toInt(process.env.OTP_MAX_ATTEMPTS, 5),
};
