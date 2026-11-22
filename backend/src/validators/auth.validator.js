const HttpError = require('../utils/httpError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 8;

const str = (v) => (typeof v === 'string' ? v : '');
const normalizeEmail = (v) => str(v).trim().toLowerCase();

const throwIfErrors = (errors) => {
  if (Object.keys(errors).length) throw new HttpError(400, 'Validasi gagal', errors);
};

const checkEmail = (email, errors) => {
  if (!email) errors.email = 'Email wajib diisi';
  else if (email.length > 254 || !EMAIL_REGEX.test(email)) errors.email = 'Format email tidak valid';
};

/** Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka. */
const checkPassword = (field, password, confirm, errors) => {
  if (!password) errors[field] = 'Kata sandi wajib diisi';
  else if (password.length < PASSWORD_MIN) errors[field] = `Kata sandi minimal ${PASSWORD_MIN} karakter`;
  else if (password.length > 72) errors[field] = 'Kata sandi maksimal 72 karakter';
  else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    errors[field] = 'Kata sandi harus mengandung huruf besar, huruf kecil, dan angka';

  if (!confirm) errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
  else if (password !== confirm) errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
};

const validateRegister = (body = {}) => {
  const name = str(body.name).trim().replace(/\s+/g, ' ');
  const email = normalizeEmail(body.email);
  const password = str(body.password);
  const confirmPassword = str(body.confirmPassword);
  const errors = {};

  if (!name) errors.name = 'Nama wajib diisi';
  else if (name.length < 3 || name.length > 150) errors.name = 'Nama harus 3-150 karakter';
  checkEmail(email, errors);
  checkPassword('password', password, confirmPassword, errors);
  throwIfErrors(errors);

  return { name, email, password, recaptchaToken: body.recaptchaToken };
};

const validateEmailOnly = (body = {}) => {
  const email = normalizeEmail(body.email);
  const errors = {};
  checkEmail(email, errors);
  throwIfErrors(errors);
  return { email, recaptchaToken: body.recaptchaToken };
};

const validateLogin = (body = {}) => {
  const email = normalizeEmail(body.email);
  const password = str(body.password);
  const errors = {};
  checkEmail(email, errors);
  if (!password) errors.password = 'Kata sandi wajib diisi';
  throwIfErrors(errors);
  return { email, password, recaptchaToken: body.recaptchaToken };
};

const checkOtp = (otp, errors) => {
  if (!otp) errors.otp = 'Kode OTP wajib diisi';
  else if (!/^\d{6}$/.test(otp)) errors.otp = 'Kode OTP harus 6 digit angka';
};

const validateVerifyOtp = (body = {}) => {
  const email = normalizeEmail(body.email);
  const otp = str(body.otp).trim();
  const errors = {};
  checkEmail(email, errors);
  checkOtp(otp, errors);
  throwIfErrors(errors);
  return { email, otp };
};

const validateResetPassword = (body = {}) => {
  const email = normalizeEmail(body.email);
  const otp = str(body.otp).trim();
  const newPassword = str(body.newPassword);
  const confirmPassword = str(body.confirmPassword);
  const errors = {};
  checkEmail(email, errors);
  checkOtp(otp, errors);
  checkPassword('newPassword', newPassword, confirmPassword, errors);
  throwIfErrors(errors);
  return { email, otp, newPassword };
};

const validateVerifyEmailToken = (query = {}) => {
  const token = str(query.token).trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new HttpError(400, 'Link verifikasi tidak valid atau sudah kedaluwarsa');
  }
  return { token };
};

module.exports = {
  validateRegister,
  validateEmailOnly,
  validateLogin,
  validateVerifyOtp,
  validateResetPassword,
  validateVerifyEmailToken,
};
