import pg from 'pg';

const { Pool } = pg;
let pool;

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
