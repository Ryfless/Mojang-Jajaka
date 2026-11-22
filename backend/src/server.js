const env = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[db] Terhubung ke PostgreSQL');
  } catch (err) {
    console.error('[db] Gagal terhubung ke PostgreSQL:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[server] MOKA backend berjalan di ${env.appBaseUrl}`);
    console.log(`[server] Swagger UI: ${env.appBaseUrl}/api-docs`);
  });

  const shutdown = () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
