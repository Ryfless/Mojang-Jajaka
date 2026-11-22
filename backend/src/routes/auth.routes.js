const { Router } = require('express');
const c = require('../controllers/auth.controller');
const rl = require('../middlewares/rateLimiters');

const router = Router();

router.use(rl.authLimiter);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Registrasi akun peserta + reCAPTCHA + kirim direct link verifikasi email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201:
 *         description: Registrasi berhasil, link verifikasi dikirim ke email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { description: Verifikasi reCAPTCHA gagal }
 *       409: { description: Email sudah terdaftar }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post('/register', rl.registerLimiter, c.register);

/**
 * @openapi
 * /api/auth/verify-email:
 *   get:
 *     tags: [Auth / User Management]
 *     summary: Verifikasi email melalui direct link (token sekali pakai)
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Token mentah dari link di email
 *     responses:
 *       200:
 *         description: Email berhasil diverifikasi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { description: Token tidak valid, sudah dipakai, atau kedaluwarsa }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get('/verify-email', c.verifyEmail);

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Kirim ulang direct link verifikasi email (token lama dibatalkan)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EmailRecaptchaRequest' }
 *     responses:
 *       200:
 *         description: Respons generik (link dikirim bila akun ada & belum terverifikasi)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { description: Verifikasi reCAPTCHA gagal }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post('/resend-verification', rl.emailLimiter, c.resendVerification);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Login + reCAPTCHA (email wajib sudah terverifikasi)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login berhasil, mengembalikan JWT dan data user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { description: Email atau kata sandi salah }
 *       403: { description: Email belum diverifikasi / reCAPTCHA gagal }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post('/login', rl.loginLimiter, c.login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Minta kode OTP 6 digit untuk reset kata sandi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EmailRecaptchaRequest' }
 *     responses:
 *       200:
 *         description: Respons generik (OTP dikirim bila email terdaftar & terverifikasi)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { description: Verifikasi reCAPTCHA gagal }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post('/forgot-password', rl.emailLimiter, c.forgotPassword);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Verifikasi kode OTP reset kata sandi (maks. 5 percobaan)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyOtpRequest' }
 *     responses:
 *       200:
 *         description: OTP valid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400: { description: OTP salah / kedaluwarsa }
 *       429: { description: Percobaan OTP melebihi batas }
 */
router.post('/verify-otp', rl.otpLimiter, c.verifyOtp);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth / User Management]
 *     summary: Atur kata sandi baru menggunakan OTP yang sudah diverifikasi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
 *     responses:
 *       200:
 *         description: Kata sandi berhasil diperbarui
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400: { description: Validasi gagal / OTP tidak valid, belum diverifikasi, atau sudah dipakai }
 *       429: { description: Percobaan OTP melebihi batas }
 */
router.post('/reset-password', rl.otpLimiter, c.resetPassword);

module.exports = router;
