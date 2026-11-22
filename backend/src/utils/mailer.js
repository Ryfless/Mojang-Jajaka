const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const layout = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
  <h2 style="color:#7a1f1f;margin-top:0">${title}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="font-size:12px;color:#888">Email ini dikirim otomatis oleh MOKA Kabupaten Bogor. Abaikan jika Anda tidak merasa melakukan permintaan ini.</p>
</div>`;

const sendVerificationEmail = async ({ to, name, link, expiresMinutes }) => {
  const safeName = escapeHtml(name);
  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject: 'Verifikasi Email Akun MOKA',
    text: `Halo ${name},\n\nKlik link berikut untuk memverifikasi email Anda (berlaku ${expiresMinutes} menit):\n${link}\n\nMOKA Kabupaten Bogor`,
    html: layout(
      'Verifikasi Email Anda',
      `<p>Halo <b>${safeName}</b>,</p>
       <p>Terima kasih telah mendaftar di portal MOKA. Klik tombol di bawah untuk memverifikasi email Anda. Link berlaku <b>${expiresMinutes} menit</b> dan hanya dapat digunakan satu kali.</p>
       <p style="text-align:center;margin:28px 0"><a href="${link}" style="background:#7a1f1f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Verifikasi Email</a></p>
       <p style="font-size:12px;word-break:break-all">Atau salin link ini: ${link}</p>`,
    ),
  });
};

const sendOtpEmail = async ({ to, name, otp, expiresMinutes }) => {
  const safeName = escapeHtml(name);
  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject: 'Kode OTP Reset Kata Sandi MOKA',
    text: `Halo ${name},\n\nKode OTP reset kata sandi Anda: ${otp}\nBerlaku ${expiresMinutes} menit. Jangan bagikan kode ini kepada siapa pun.\n\nMOKA Kabupaten Bogor`,
    html: layout(
      'Reset Kata Sandi',
      `<p>Halo <b>${safeName}</b>,</p>
       <p>Gunakan kode OTP berikut untuk mereset kata sandi Anda. Kode berlaku <b>${expiresMinutes} menit</b>.</p>
       <p style="text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;margin:28px 0">${otp}</p>
       <p>Jangan bagikan kode ini kepada siapa pun, termasuk panitia.</p>`,
    ),
  });
};

module.exports = { transporter, sendVerificationEmail, sendOtpEmail };
