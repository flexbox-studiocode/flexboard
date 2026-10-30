import pg from 'pg';

const { Pool, types } = pg;
let pool;

// A PostgreSQL DATE (no time, no zone) must never be converted into an instant.
// The default parser builds a JS Date at local midnight, and JSON.stringify then renders it as
// a UTC ISO string, which shifts the calendar day backwards for any timezone east of UTC
// (e.g. Asia/Jakarta becomes the previous day). Parse DATE columns as plain 'YYYY-MM-DD' text
// so the day the user picked is exactly the day stored and shown.
types.setTypeParser(types.builtins.DATE, value => value);

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is required for backend database operations.');
  return value;
}

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: getDatabaseUrl(), max: Number(process.env.DB_POOL_MAX || 5), connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, allowExitOnIdle: true });
    pool.on('error', () => {});
  }
  return pool;
}

export async function query(text, values) { return getPool().query(text, values); }
export async function closePool() { if (pool) { await pool.end(); pool = undefined; } }
