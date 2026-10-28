import { input, password } from '@inquirer/prompts';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { closePool, getPool } from '../server/db/pool.js';

function assertDevelopmentDatabase() {
  if (process.env.NODE_ENV === 'production') throw new Error('Password reset is disabled in production.');
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL wajib tersedia.');
  let database;
  try { database = new URL(rawUrl).pathname.slice(1); } catch { throw new Error('DATABASE_URL tidak valid.'); }
  if (!/^flexboard_(db|dev|development)$/.test(database)) throw new Error('Password reset requires an approved local development database.');
}

async function main() {
  assertDevelopmentDatabase();
  const email = (await input({
    message: 'Email akun:',
    validate: value => /^\S+@\S+\.\S+$/.test(value.trim().toLowerCase()) ? true : 'Email tidak valid.',
  })).trim().toLowerCase();
  const first = await password({ message: 'Password baru:', mask: '*', toggleMask: false, validate: value => value.length >= 8 ? true : 'Password minimal 8 karakter.' });
  const confirmation = await password({ message: 'Konfirmasi password baru:', mask: '*', toggleMask: false });
  if (first !== confirmation) throw new Error('Konfirmasi password tidak cocok.');

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [email]);
    if (user.rowCount !== 1) throw new Error('Akun dengan email tersebut tidak ditemukan atau tidak unik.');
    const account = await client.query('SELECT id FROM account WHERE "userId"=$1 AND "providerId"=\'credential\' FOR UPDATE', [user.rows[0].id]);
    if (account.rowCount !== 1) throw new Error('Akun credential tidak ditemukan atau tidak unik.');
    const profile = await client.query('SELECT id FROM profiles WHERE auth_subject=$1 AND is_active=true', [user.rows[0].id]);
    if (profile.rowCount !== 1) throw new Error('Profil akun tidak ditemukan atau tidak aktif.');
    const newHash = await hashPassword(first);
    if (!(await verifyPassword({ hash: newHash, password: first }))) throw new Error('Verifikasi password baru gagal.');
    await client.query('UPDATE account SET password=$1,"updatedAt"=now() WHERE id=$2', [newHash, account.rows[0].id]);
    await client.query('COMMIT');
    console.log('Reset password berhasil.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
