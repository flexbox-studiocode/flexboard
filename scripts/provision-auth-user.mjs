import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { getPool, closePool } from '../server/db/pool.js';
import { provisionAuthUser } from '../server/provisioning.js';

function hiddenQuestion(prompt) {
  if (!input.isTTY || !output.isTTY) return Promise.reject(new Error('Password input membutuhkan terminal interaktif.'));
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input, output, terminal: true });
    const originalWrite = rl._writeToOutput;
    rl._writeToOutput = text => {
      if (text.includes(prompt)) output.write(text);
    };
    const finish = (error, value) => {
      rl._writeToOutput = originalWrite;
      rl.close();
      if (error) reject(error);
      else resolve(value);
    };
    rl.once('error', error => finish(error));
    rl.question(prompt, value => finish(null, value));
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Provisioning is disabled in production.');
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL wajib tersedia.');
  let database;
  try { database = new URL(rawUrl).pathname.slice(1); } catch { throw new Error('DATABASE_URL tidak valid.'); }
  if (!/^flexboard_(db|dev|development)$/.test(database)) throw new Error('Provisioning requires an approved local development database.');

  const rl = readline.createInterface({ input, output });
  let client;
  try {
    const name = (await new Promise(resolve => rl.question('Nama tampilan: ', resolve))).trim();
    const email = (await new Promise(resolve => rl.question('Email: ', resolve))).trim();
    const role = (await new Promise(resolve => rl.question('Role (leader/member): ', resolve))).trim().toLowerCase();
    rl.close();
    const password = await hiddenQuestion('Password: ');
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
    rl.close();
    client?.release();
    await closePool();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
