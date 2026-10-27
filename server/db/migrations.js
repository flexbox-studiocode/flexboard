import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './pool.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');
async function files() { return (await fs.readdir(root)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})); }
async function ensure(pool) { await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'); }
export async function migrationStatus() { const pool=getPool(); await ensure(pool); const applied=(await pool.query('SELECT version, applied_at FROM schema_migrations ORDER BY version')).rows; return { files: await files(), applied }; }
export async function migrate() { const pool=getPool(); await ensure(pool); const lock=await pool.connect(); try { await lock.query('SELECT pg_advisory_lock(hashtext($1))',['flexboard:migrations']); for (const name of await files()) { const exists=await lock.query('SELECT 1 FROM schema_migrations WHERE version=$1',[name]); if (exists.rowCount) continue; const sql=await fs.readFile(path.join(root,name),'utf8'); await lock.query('BEGIN'); try { await lock.query(sql); await lock.query('INSERT INTO schema_migrations(version) VALUES($1)',[name]); await lock.query('COMMIT'); } catch (error) { await lock.query('ROLLBACK'); throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error }); } } } finally { await lock.query('SELECT pg_advisory_unlock(hashtext($1))',['flexboard:migrations']).catch(()=>{}); lock.release(); } }
