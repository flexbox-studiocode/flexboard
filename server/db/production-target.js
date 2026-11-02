const PRODUCTION_DATABASE = 'flexboard_prod';
const NEON_HOST_SUFFIX = '.neon.tech';

/**
 * Validates that a connection string is a Neon-hosted PostgreSQL URL pointing
 * at the exact production database. Used by the manual production provisioning
 * script so that no other target (local, staging, wrong db) can ever be written
 * to. Never returns or logs the raw URL; only a redacted host/database summary.
 */
export function assertProductionProvisioningTarget(url) {
  if (!url) throw new Error('DATABASE_URL wajib tersedia.');
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL tidak valid.');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('DATABASE_URL harus berupa koneksi PostgreSQL.');
  if (!parsed.hostname.endsWith(NEON_HOST_SUFFIX)) throw new Error('Provisioning production hanya diizinkan untuk hostname Neon (*.neon.tech).');
  const database = parsed.pathname.replace(/^\//, '');
  if (database !== PRODUCTION_DATABASE) throw new Error(`Database target harus "${PRODUCTION_DATABASE}", bukan "${database || '(kosong)'}".`);
  return { host: parsed.hostname, database, port: parsed.port || '5432' };
}

export function normalizeProvisioningEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Format email tidak valid.');
  return email;
}

export const PROVISIONING_ROLES = ['leader', 'member'];

export function assertProvisioningRole(role) {
  if (!PROVISIONING_ROLES.includes(role)) throw new Error(`Role "${role}" tidak diizinkan. Pilih leader atau member.`);
  return role;
}

export const MIN_PASSWORD_LENGTH = 8;

export function assertProvisioningPassword(value) {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD_LENGTH) throw new Error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  return value;
}

export function assertProvisioningName(value) {
  const name = String(value ?? '').trim();
  if (!name) throw new Error('Nama tampilan wajib diisi.');
  if (name.length > 120) throw new Error('Nama tampilan maksimal 120 karakter.');
  return name;
}
