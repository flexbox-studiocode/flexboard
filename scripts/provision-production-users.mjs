/**
 * Provisioning akun production FlexBoard (Neon PostgreSQL).
 *
 * Membuat SATU akun Better Auth (leader atau member) per eksekusi pada database
 * production `flexboard_prod` yang di-host Neon. Secara sengaja:
 * - hanya bisa dijalankan manual dari terminal lokal (bukan endpoint HTTP),
 * - menolak database lokal / non-Neon / nama database lain,
 * - tidak menjalankan migrasi, seed, DROP, TRUNCATE, atau reset apa pun,
 * - tidak menampilkan connection string, password, atau password hash.
 *
 * Jalankan dengan: npm run auth:provision:production
 */
import { input, password, select, confirm } from '@inquirer/prompts';
import { getPool, closePool } from '../server/db/pool.js';
import { provisionAuthUser } from '../server/provisioning.js';
import {
  assertProductionProvisioningTarget,
  assertProvisioningPassword,
  assertProvisioningRole,
  normalizeProvisioningEmail
} from '../server/db/production-target.js';

const EMAIL_TAKEN = 'Email sudah terdaftar. Gunakan email lain.';

function fail(message) {
  const error = new Error(message);
  error.explicit = true;
  throw error;
}

async function askIdentity() {
  const name = (
    await input({
      message: 'Nama tampilan:',
      validate: (value) => (value.trim() ? true : 'Nama tampilan wajib diisi.')
    })
  ).trim();

  const email = normalizeProvisioningEmail(
    await input({
      message: 'Email:',
      validate: (value) => {
        try {
          normalizeProvisioningEmail(value);
          return true;
        } catch (error) {
          return error.message;
        }
      }
    })
  );

  const role = assertProvisioningRole(
    await select({
      message: 'Role:',
      choices: [
        { name: 'leader', value: 'leader' },
        { name: 'member', value: 'member' }
      ]
    })
  );

  const enteredPassword = await password({
    message: 'Password (minimal 8 karakter):',
    mask: '*',
    toggleMask: false,
    validate: (value) => {
      try {
        assertProvisioningPassword(value);
        return true;
      } catch (error) {
        return error.message;
      }
    }
  });

  return { name, email, role, password: enteredPassword };
}

async function main() {
  // NODE_ENV=production di .env.neon adalah mode target DB Neon, bukan deployment.
  // Script ini tidak pernah dijalankan otomatis oleh runtime server/Vercel.
  if (process.env.VERCEL) fail('Provisioning production tidak boleh dijalankan di lingkungan Vercel.');

  const target = assertProductionProvisioningTarget(process.env.DATABASE_URL);

  const dryRun = process.argv.includes('--dry-run');
  console.log('\n=== FlexBoard · Provisioning Akun Production ===');
  console.log(`Host     : ${target.host}`);
  console.log(`Database : ${target.database} (Neon PostgreSQL)`);
  if (dryRun) console.log('Mode     : DRY RUN — input divalidasi, tidak ada penulisan database.');
  console.log('Peringatan: akun yang dibuat akan langsung aktif di website production.\n');

  const identity = await askIdentity();

  if (dryRun) {
    console.log('\nInput valid. Tidak ada perubahan dibuat ke database.');
    return;
  }

  const confirmed = await confirm({
    message: `Buat akun ${identity.role} "${identity.name}" (${identity.email}) di ${target.database}?`,
    default: false
  });
  if (!confirmed) {
    console.log('Dibatalkan. Tidak ada perubahan dibuat.');
    return;
  }

  let client;
  try {
    client = await getPool().connect();

    // Nilai sudah dinormalisasi ke lowercase sebelum query & provisioning.
    const existing = await client.query('SELECT id FROM "user" WHERE lower(email)=$1', [identity.email]);
    if (existing.rowCount > 0) fail(EMAIL_TAKEN);

    const result = await provisionAuthUser({
      client,
      email: identity.email,
      name: identity.name,
      role: identity.role,
      password: identity.password
    });

    console.log('\nAkun production berhasil dibuat:');
    console.log(`  Role       : ${identity.role}`);
    console.log(`  Email      : ${identity.email}`);
    console.log(`  User ID    : ${result.userId}`);
    console.log(`  Profile ID : ${result.profileId}`);
    console.log('\nLogin melalui website production menggunakan email dan password yang baru dibuat.');
  } finally {
    client?.release();
    await closePool();
  }
}

main().catch((error) => {
  // Hanya cetak pesan; connection string, password, dan hash tidak pernah dicetak.
  const safeMessages = [
    /^DATABASE_URL/,
    /^Provisioning/,
    /^Role /,
    /^Password /,
    /^Nama /,
    /^Format /,
    /^Database /
  ];
  const isSafe = error?.explicit || error?.code === 'EMAIL_TAKEN' || safeMessages.some((rx) => rx.test(error?.message ?? ''));
  console.error(`\nGagal: ${isSafe ? error.message : 'Terjadi kesalahan saat menghubungi database production.'}`);
  if (error?.code && error.code !== 'EMAIL_TAKEN') console.error(`Kode error: ${error.code}`);
  process.exitCode = 1;
});
