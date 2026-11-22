const crypto = require('crypto');
const env = require('../config/env');

/** Token acak kriptografis (hex) untuk link verifikasi email. */
const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/** SHA-256 untuk token mentah yang disimpan di DB. */
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** OTP 6 digit (100000 - 999999). */
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

/** Hash OTP dengan HMAC + secret server, sehingga 6 digit tidak mudah di-bruteforce dari DB. */
const hashOtp = (otp) => crypto.createHmac('sha256', env.jwtSecret).update(String(otp)).digest('hex');

/** Perbandingan hash constant-time. */
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { generateToken, sha256, generateOtp, hashOtp, safeEqual };
