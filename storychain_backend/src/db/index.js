'use strict';

/**
 * Database module for PostgreSQL connection pooling.
 * Uses DATABASE_URL from environment variables.
 * Exposes:
 *  - pool: the pg Pool instance (for advanced usage/transactions)
 *  - query: convenience method for simple text queries
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

// PUBLIC_INTERFACE
function createPool() {
  /**
   * Create and return a configured pg Pool.
   * This function reads the DATABASE_URL env var and sets sane defaults.
   */
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // We intentionally don't throw here to allow app startup in environments
    // where DB isn't configured yet, but we log a clear warning.
    // Consumers should handle query errors if pool cannot connect.
    console.warn('[db] DATABASE_URL is not set. Database connections will fail until it is configured.');
  }

  const isProd = (process.env.NODE_ENV || 'development') === 'production';

  // Note: If using managed Postgres with SSL, set PGSSLMODE=require in env or add ssl options here.
  const pool = new Pool({
    connectionString,
    // honor SSL if DATABASE_URL includes sslmode or if PGSSLMODE=require
    ssl: process.env.PGSSLMODE === 'require' || process.env.PGSSLMODE === 'require-verify'
      ? { rejectUnauthorized: process.env.PGSSLMODE === 'require-verify' }
      : undefined,
    max: parseInt(process.env.PG_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.PG_POOL_CONN_TIMEOUT_MS || '10000', 10),
    allowExitOnIdle: false,
  });

  // Basic logging for connection errors
  pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client', err);
  });

  // Optional: basic test on startup in non-production to surface misconfig early
  if (!isProd && connectionString) {
    pool
      .query('SELECT 1')
      .then(() => console.log('[db] Connection pool initialized'))
      .catch((err) => console.warn('[db] Initial connectivity check failed:', err.message));
  }

  return pool;
}

// Initialize a singleton pool
const pool = createPool();

// PUBLIC_INTERFACE
async function query(text, params) {
  /**
   * Run a simple query using the shared pool.
   * @param {string} text - SQL query text with placeholders
   * @param {Array} params - Parameter values
   * @returns {Promise<import('pg').QueryResult>}
   */
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
};
