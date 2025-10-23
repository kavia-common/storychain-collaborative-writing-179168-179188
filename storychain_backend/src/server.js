const app = require('./app');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// surface common env warnings
if (!process.env.DATABASE_URL) {
  console.warn('[env] DATABASE_URL is not set. Database operations will fail.');
}
if (!process.env.JWT_SECRET) {
  console.warn('[env] JWT_SECRET is not set; using insecure default. Set JWT_SECRET for production.');
}

// Apply migrations on startup (best-effort)
runMigrations()
  .then(() => console.log('[server] Migrations up-to-date'))
  .catch((err) => console.error('[server] Migration error:', err.message));

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
