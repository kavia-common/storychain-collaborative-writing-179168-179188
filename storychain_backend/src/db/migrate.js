'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

/**
 * Simple migration runner to apply SQL files in src/db/migrations in lexicographic order.
 * It creates a migrations table to track applied files.
 */
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const res = await pool.query('SELECT filename FROM _migrations');
  return new Set(res.rows.map(r => r.filename));
}

// PUBLIC_INTERFACE
async function runMigrations() {
  /**
   * Apply pending .sql migrations in src/db/migrations.
   */
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn('[migrate] No migrations directory found:', migrationsDir);
    return;
  }
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // lexicographic order

  for (const file of files) {
    if (applied.has(file)) continue;
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`[migrate] Applying ${file}...`);
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      console.log(`[migrate] Applied ${file}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`[migrate] Failed ${file}:`, err.message);
      throw err;
    }
  }
}

module.exports = {
  runMigrations,
};
