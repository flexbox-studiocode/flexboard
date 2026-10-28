import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { getPool, closePool } from '../server/db/pool.js';
import { provisionAuthUser } from '../server/provisioning.js';
import { readHiddenInput } from './password-input.mjs';

function question(rl, prompt) {
  return new Promise((resolve, reject) => {
    const onError = error => reject(error);
    rl.once('error', onError);
    rl.question(prompt, value => {
      rl.off('error', onError);
      resolve(value);
    });
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Provisioning is disabled in production.');
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL wajib tersedia.');
  let database;
  try { database = new URL(rawUrl).pathname.slice(1); } catch { throw new Error('DATABASE_URL tidak valid.'); }
  if (!/^flexboard_(db|dev|development)$/.test(database)) throw new Error('Provisioning requires an approved local development database.');

  let client;
  let rl;
  try {
    rl = readline.createInterface({ input, output });
    const name = (await question(rl, 'Nama tampilan: ')).trim();
    const email = (await question(rl, 'Email: ')).trim();
    const role = (await question(rl, 'Role (leader/member): ')).trim().toLowerCase();
    rl.close();
    rl = undefined;

    const password = await readHiddenInput();
    const validEmail = /^\S+@\S+\.\S+$/.test(email.toLowerCase());
    if (!name || !validEmail || !['leader', 'member'].includes(role) || password.length < 8) throw new Error('Input provisioning tidak valid.');
    if (process.argv.includes('--dry-run')) {
      console.log('Input provisioning valid; tidak ada perubahan dibuat.');
      return;
    }
    client = await getPool().connect();
    const userId = await provisionAuthUser({ client, email, name, role, password });
    console.log(`Auth user berhasil ditautkan: ${userId}`);
  } finally {
    rl?.close();
    client?.release();
    await closePool();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
