/**
 * Manual, local-only password reset for the existing Fakhri production account.
 * Run with: node --env-file=.env.neon scripts/reset-production-user-password.mjs
 * Never prints a password, hash, connection string, or session token.
 */
import { confirm, input, password } from '@inquirer/prompts';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { closePool, getPool } from '../server/db/pool.js';
import { assertProductionProvisioningTarget, assertProvisioningPassword, normalizeProvisioningEmail } from '../server/db/production-target.js';

const TARGET_EMAIL = 'fakhri@flexbox.id';

function fail(message) {
  const error = new Error(message);
  error.explicit = true;
  throw error;
}

function assertLocalProductionResetEnvironment() {
  if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.CI) {
    fail('Password reset production hanya boleh dijalankan dari terminal lokal.');
  }
  return assertProductionProvisioningTarget(process.env.DATABASE_URL);
}

async function main() {
  const target = assertLocalProductionResetEnvironment();
  console.log('\n=== FlexBoard · Reset Password Production ===');
  console.log(`Host     : ${target.host}`);
  console.log(`Database : ${target.database} (Neon PostgreSQL)`);
  console.log(`Target   : ${TARGET_EMAIL}`);

  const email = normalizeProvisioningEmail(await input({
    message: 'Email target:',
    validate: (value) => {
      try { return normalizeProvisioningEmail(value) === TARGET_EMAIL ? true : 'Target harus fakhri@flexbox.id.'; }
      catch (error) { return error.message; }
    }
  }));
  if (email !== TARGET_EMAIL) fail('Reset hanya diizinkan untuk fakhri@flexbox.id.');

  const first = await password({
    message: 'Password baru (minimal 8 karakter):', mask: '*', toggleMask: false,
    validate: (value) => { try { assertProvisioningPassword(value); return true; } catch (error) { return error.message; } }
  });
  const confirmation = await password({ message: 'Konfirmasi password baru:', mask: '*', toggleMask: false });
  if (first !== confirmation) fail('Konfirmasi password tidak cocok.');

  const confirmed = await confirm({ message: `Reset password akun ${TARGET_EMAIL} pada ${target.database}?`, default: false });
  if (!confirmed) { console.log('Dibatalkan. Tidak ada perubahan dibuat.'); return; }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id,email,name FROM "user" WHERE lower(email)=lower($1) FOR UPDATE', [email]);
    if (user.rowCount !== 1) fail('User target tidak ditemukan atau tidak unik.');
    const account = await client.query('SELECT id,"providerId","userId" FROM account WHERE "userId"=$1 AND "providerId"=$2 FOR UPDATE', [user.rows[0].id, 'credential']);
    if (account.rowCount !== 1) fail('Credential account target tidak ditemukan atau tidak unik.');
    if (account.rows[0].userId !== user.rows[0].id) fail('Credential account tidak terhubung ke user target.');
    const profile = await client.query('SELECT id,auth_subject,role,is_active FROM profiles WHERE auth_subject=$1 FOR UPDATE', [user.rows[0].id]);
    if (profile.rowCount !== 1 || !profile.rows[0].is_active) fail('Profile target tidak ditemukan atau tidak aktif.');
    const newHash = await hashPassword(first);
    if (!(await verifyPassword({ hash: newHash, password: first }))) fail('Verifikasi password baru gagal.');
    await client.query('UPDATE account SET password=$1,"updatedAt"=now() WHERE id=$2 AND "userId"=$3 AND "providerId"=$4', [newHash, account.rows[0].id, user.rows[0].id, 'credential']);
    const revoked = await client.query('DELETE FROM "session" WHERE "userId"=$1', [user.rows[0].id]);
    await client.query('COMMIT');
    console.log('\nReset password berhasil.');
    console.log(`  Email          : ${user.rows[0].email}`);
    console.log(`  Role           : ${profile.rows[0].role}`);
    console.log(`  Session dicabut: ${revoked.rowCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error(`\nGagal: ${error?.explicit ? error.message : 'Terjadi kesalahan saat mereset password production.'}`);
  process.exitCode = 1;
});
