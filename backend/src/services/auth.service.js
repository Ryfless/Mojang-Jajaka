const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { generateToken, sha256, generateOtp, hashOtp, safeEqual } = require('../utils/crypto');
const { sendVerificationEmail, sendOtpEmail } = require('../utils/mailer');

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS = 'Email atau kata sandi salah';
const INVALID_OTP = 'Kode OTP tidak valid atau sudah kedaluwarsa';
// Hash dummy agar waktu respons login tetap konsisten walau email tidak terdaftar.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const toPublicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const findUserByEmail = async (email, client = db) => {
  const { rows } = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return rows[0] || null;
};

/** Batalkan token lama, buat token baru, lalu kirim direct link verifikasi. */
const issueVerificationLink = async (user) => {
  const rawToken = generateToken(32);
  await db.withTransaction(async (client) => {
    await client.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id],
    );
    await client.query(
      `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, NOW() + make_interval(mins => $4), NOW())`,
      [crypto.randomUUID(), user.id, sha256(rawToken), env.emailVerificationExpiresMinutes],
    );
  });

  const link = `${env.appBaseUrl}/api/auth/verify-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    link,
    expiresMinutes: env.emailVerificationExpiresMinutes,
  });
};

const register = async ({ name, email, password }) => {
  if (await findUserByEmail(email)) {
    throw new HttpError(409, 'Email sudah terdaftar', { email: 'Email sudah terdaftar' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    const { rows } = await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'participant', NULL, NOW(), NOW())
       RETURNING id, name, email, role`,
      [crypto.randomUUID(), name, email, passwordHash],
    );
    user = rows[0];
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'Email sudah terdaftar', { email: 'Email sudah terdaftar' });
    throw err;
  }

  try {
    await issueVerificationLink(user);
  } catch (err) {
    console.error('[register] Gagal mengirim email verifikasi:', err.message);
    return { user, emailSent: false };
  }
  return { user, emailSent: true };
};

const verifyEmail = async ({ token }) => {
  return db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id FROM email_verification_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [sha256(token)],
    );
    const record = rows[0];
    if (!record) throw new HttpError(400, 'Link verifikasi tidak valid, sudah digunakan, atau sudah kedaluwarsa');

    await client.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [record.id]);
    const { rows: users } = await client.query(
      `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
       WHERE id = $1 RETURNING id, name, email, role`,
      [record.user_id],
    );
    return users[0];
  });
};

const resendVerification = async ({ email }) => {
  const user = await findUserByEmail(email);
  // Respons generik untuk mencegah email enumeration; hanya kirim bila akun ada & belum terverifikasi.
  if (user && !user.email_verified_at) {
    await issueVerificationLink(user);
  }
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, INVALID_CREDENTIALS);

  if (!user.email_verified_at) {
    throw new HttpError(
      403,
      'Email belum diverifikasi. Silakan klik link verifikasi yang telah dikirim ke email Anda terlebih dahulu.',
    );
  }

  const publicUser = toPublicUser(user);
  const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  return { accessToken, tokenType: 'Bearer', expiresIn: env.jwtExpiresIn, user: publicUser };
};

const forgotPassword = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user || !user.email_verified_at) return; // respons tetap generik

  const otp = generateOtp();
  await db.withTransaction(async (client) => {
    await client.query('UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [
      user.id,
    ]);
    await client.query(
      `INSERT INTO password_reset_otps (id, user_id, otp_hash, attempts, expires_at, created_at)
       VALUES ($1, $2, $3, 0, NOW() + make_interval(mins => $4), NOW())`,
      [crypto.randomUUID(), user.id, hashOtp(otp), env.otpExpiresMinutes],
    );
  });

  await sendOtpEmail({ to: user.email, name: user.name, otp, expiresMinutes: env.otpExpiresMinutes });
};

/** Ambil OTP aktif terbaru milik user (terkunci FOR UPDATE di dalam transaksi). */
const getActiveOtp = async (client, userId) => {
  const { rows } = await client.query(
    `SELECT * FROM password_reset_otps
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1
     FOR UPDATE`,
    [userId],
  );
  return rows[0] || null;
};

/**
 * Cocokkan OTP. Jika salah, naikkan attempts (dan kunci OTP bila melewati batas).
 * Mengembalikan record OTP jika cocok, atau melempar HttpError.
 */
const matchOtp = async (client, userId, otp) => {
  const record = await getActiveOtp(client, userId);
  if (!record) return { error: new HttpError(400, INVALID_OTP) };

  if (record.attempts >= env.otpMaxAttempts) {
    return {
      error: new HttpError(429, 'Percobaan OTP melebihi batas. Silakan minta kode OTP baru.'),
    };
  }

  if (!safeEqual(hashOtp(otp), record.otp_hash)) {
    const attempts = record.attempts + 1;
    await client.query('UPDATE password_reset_otps SET attempts = $1 WHERE id = $2', [attempts, record.id]);
    const remaining = Math.max(env.otpMaxAttempts - attempts, 0);
    return {
      error:
        remaining === 0
          ? new HttpError(429, 'Percobaan OTP melebihi batas. Silakan minta kode OTP baru.')
          : new HttpError(400, `${INVALID_OTP}. Sisa percobaan: ${remaining}`),
    };
  }

  return { record };
};

// Catatan: transaksi harus COMMIT walau OTP salah agar increment attempts tersimpan,
// sehingga error dilempar SETELAH transaksi selesai.
const verifyOtp = async ({ email, otp }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new HttpError(400, INVALID_OTP);

  const result = await db.withTransaction(async (client) => {
    const { record, error } = await matchOtp(client, user.id, otp);
    if (error) return { error };
    await client.query('UPDATE password_reset_otps SET verified_at = COALESCE(verified_at, NOW()) WHERE id = $1', [
      record.id,
    ]);
    return {};
  });
  if (result.error) throw result.error;
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new HttpError(400, INVALID_OTP);

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const result = await db.withTransaction(async (client) => {
    const { record, error } = await matchOtp(client, user.id, otp);
    if (error) return { error };
    if (!record.verified_at) {
      return { error: new HttpError(400, 'Kode OTP belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.') };
    }

    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      user.id,
    ]);
    await client.query('UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [
      user.id,
    ]);
    return {};
  });
  if (result.error) throw result.error;
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
