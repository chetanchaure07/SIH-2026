// ============================================================
// PostgreSQL connection pool
// Reads DATABASE_URL from .env — NEVER hardcode credentials.
// ============================================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[DB] ERROR: DATABASE_URL environment variable is not set.');
  console.error('[DB] Copy .env.example to .env and fill in your PostgreSQL credentials.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings suitable for a local prototype
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connectivity on startup
pool.connect((err, client, done) => {
  if (err) {
    console.error('[DB] Failed to connect to PostgreSQL:', err.message);
    console.error('[DB] Make sure PostgreSQL is running and DATABASE_URL is correct.');
    // Do not exit — let individual requests fail gracefully
  } else {
    console.log('[DB] Connected to PostgreSQL successfully.');
    done();
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});
