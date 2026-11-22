const authService = require('../services/auth.service');
const { verifyRecaptcha } = require('../utils/recaptcha');
const v = require('../validators/auth.validator');

const register = async (req, res) => {
  const input = v.validateRegister(req.body);
  await verifyRecaptcha(input.recaptchaToken, req.ip);
  const { user, emailSent } = await authService.register(input);

  res.status(201).json({
    message: emailSent
      ? 'Registrasi berhasil. Silakan cek kotak masuk email Anda dan klik link verifikasi untuk mengaktifkan akun.'
      : 'Registrasi berhasil, namun email verifikasi gagal dikirim. Silakan gunakan fitur kirim ulang link verifikasi.',
    user,
  });
};

const verifyEmail = async (req, res) => {
  const input = v.validateVerifyEmailToken(req.query);
  const user = await authService.verifyEmail(input);
  res.status(200).json({ message: 'Email berhasil diverifikasi. Akun Anda siap digunakan untuk login.', user });
};

const resendVerification = async (req, res) => {
  const input = v.validateEmailOnly(req.body);
  await verifyRecaptcha(input.recaptchaToken, req.ip);
  await authService.resendVerification(input);
  res.status(200).json({
    message: 'Jika email terdaftar dan belum terverifikasi, link verifikasi baru telah dikirim.',
  });
};

const login = async (req, res) => {
  const input = v.validateLogin(req.body);
  await verifyRecaptcha(input.recaptchaToken, req.ip);
  const result = await authService.login(input);
  res.status(200).json({ message: 'Login berhasil', ...result });
};

const forgotPassword = async (req, res) => {
  const input = v.validateEmailOnly(req.body);
  await verifyRecaptcha(input.recaptchaToken, req.ip);
  try {
    await authService.forgotPassword(input);
  } catch (err) {
    // Jangan bocorkan kegagalan internal yang bisa mengindikasikan email terdaftar.
    console.error('[forgot-password]', err.message);
  }
  res.status(200).json({ message: 'Jika email terdaftar, kode OTP telah dikirim.' });
};

const verifyOtp = async (req, res) => {
  const input = v.validateVerifyOtp(req.body);
  await authService.verifyOtp(input);
  res.status(200).json({ message: 'Kode OTP valid. Silakan atur kata sandi baru.' });
};

const resetPassword = async (req, res) => {
  const input = v.validateResetPassword(req.body);
  await authService.resetPassword(input);
  res.status(200).json({ message: 'Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru.' });
};

module.exports = { register, verifyEmail, resendVerification, login, forgotPassword, verifyOtp, resetPassword };
