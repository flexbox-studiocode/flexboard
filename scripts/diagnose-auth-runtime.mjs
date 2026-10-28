import fs from 'node:fs/promises';
import { input } from '@inquirer/prompts';
import { getPool, closePool } from '../server/db/pool.js';

function metadata(raw) {
  if (!raw) return { configured: false };
  try {
    const url = new URL(raw);
    return { configured: true, protocol: url.protocol, host: url.hostname, port: url.port || (url.protocol === 'postgres:' ? '5432' : '5432'), database: decodeURIComponent(url.pathname.slice(1)) };
  } catch { return { configured: true, invalid: true }; }
}
async function envValue(path) {
  try {
    const text = await fs.readFile(path, 'utf8');
    const line = text.split(/\r?\n/).find((value) => /^\s*DATABASE_URL\s*=/.test(value));
    return line?.replace(/^\s*DATABASE_URL\s*=\s*/, '').trim().replace(/^['"]|['"]$/g, '');
  } catch { return undefined; }
}
const email = (await input({ message: 'Email akun:' })).trim().toLowerCase();
const sources = [
  ['process.env', process.env.DATABASE_URL],
  ['.env', await envValue('.env')],
  ['.env.local', await envValue('.env.local')],
];
for (const [name, value] of sources) console.log(`${name}:`, JSON.stringify(metadata(value)));
const runtime = metadata(process.env.DATABASE_URL);
try {
  const result = await getPool().query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [email]);
  console.log(`runtime database: ${JSON.stringify(runtime)}`);
  console.log(`email found in runtime database: ${result.rowCount === 1 ? 'yes' : 'no'}`);
  process.exitCode = result.rowCount === 1 ? 0 : 1;
} catch (error) {
  console.log(`runtime database query: failed (${error instanceof Error ? error.code || 'database error' : 'database error'})`);
  process.exitCode = 1;
} finally { await closePool(); }
