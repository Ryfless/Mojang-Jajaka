const env = require('../config/env');

const notFound = (req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body JSON tidak valid' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);

  const body = { message: status >= 500 && env.nodeEnv === 'production' ? 'Terjadi kesalahan pada server' : err.message };
  if (err.errors) body.errors = err.errors;
  return res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
