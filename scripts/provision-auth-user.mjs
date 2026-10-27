import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { getPool, closePool } from '../server/db/pool.js';
import { provisionAuthUser } from '../server/provisioning.js';

if (process.env.NODE_ENV === 'production') throw new Error('Provisioning is disabled in production.');
const database = new URL(process.env.DATABASE_URL || '').pathname.slice(1);
if (!/^flexboard_(db|dev|development)$/.test(database)) throw new Error('Provisioning requires an approved local development database.');
const rl = readline.createInterface({ input, output });
try {
  const name = (await rl.question('Nama tampilan: ')).trim();
  const email = (await rl.question('Email: ')).trim();
  const role = (await rl.question('Role (leader/member): ')).trim().toLowerCase();
  const password = await rl.question('Password: ', { terminal: true });
  if (process.argv.includes('--dry-run')) console.log('Input provisioning valid; tidak ada perubahan dibuat.');
  else {
    const client = await getPool().connect();
    try { const userId = await provisionAuthUser({ client, email, name, role, password }); console.log(`Auth user berhasil ditautkan: ${userId}`); }
    finally { client.release(); }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rl.close(); await closePool(); }
