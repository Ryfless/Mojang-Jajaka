const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MOKA Backend API - User Management',
      version: '1.0.0',
      description:
        'API modul User Management portal MOKA (Mojang Jajaka Kabupaten Bogor). ' +
        'Untuk uji lokal, gunakan Google reCAPTCHA Test Key sehingga `recaptchaToken` boleh diisi string apa pun (mis. `test-token`).',
    },
    servers: [{ url: env.appBaseUrl }],
    tags: [{ name: 'Auth / User Management' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        MessageResponse: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Validasi gagal' },
            errors: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Siti Rahma Putri' },
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            role: { type: 'string', enum: ['participant', 'committee'] },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'confirmPassword', 'recaptchaToken'],
          properties: {
            name: { type: 'string', example: 'Siti Rahma Putri' },
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            password: { type: 'string', example: 'PasswordKuat123!' },
            confirmPassword: { type: 'string', example: 'PasswordKuat123!' },
            recaptchaToken: { type: 'string', example: 'test-token' },
          },
        },
        EmailRecaptchaRequest: {
          type: 'object',
          required: ['email', 'recaptchaToken'],
          properties: {
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            recaptchaToken: { type: 'string', example: 'test-token' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'recaptchaToken'],
          properties: {
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            password: { type: 'string', example: 'PasswordKuat123!' },
            recaptchaToken: { type: 'string', example: 'test-token' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login berhasil' },
            accessToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'string', example: '1d' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            otp: { type: 'string', example: '123456' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['email', 'otp', 'newPassword', 'confirmPassword'],
          properties: {
            email: { type: 'string', format: 'email', example: 'siti.rahma@email.com' },
            otp: { type: 'string', example: '123456' },
            newPassword: { type: 'string', example: 'PasswordBaru123!' },
            confirmPassword: { type: 'string', example: 'PasswordBaru123!' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Validasi gagal / token tidak valid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        TooManyRequests: {
          description: 'Terlalu banyak permintaan (rate limit)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
        },
      },
    },
  },
  // swagger-jsdoc memakai glob; di Windows path wajib forward slash.
  apis: [path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')],
};

module.exports = swaggerJsdoc(options);
