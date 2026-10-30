import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

export const ROLES = ['leader', 'admin', 'member'];

/**
 * Core provisioning that assumes the caller already owns the transaction.
 * Creates (or links) a Better Auth user + credential account and links it to a profile.
 * Never returns or logs the password. Email is normalised to lowercase and required to be unique.
 * Kept separate so callers can compose profile creation, role assignment, and credential creation
 * in one atomic transaction instead of committing a half-built account.
 */
export async function provisionInTransaction({ client, email, name, role, profileId, password, jobTitle = null }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || !name.trim() || !ROLES.includes(role) || password.length < 8) throw new Error('Invalid provisioning input.');
  const profile = profileId
    ? await client.query('SELECT id, auth_subject, role FROM profiles WHERE id=$1 FOR UPDATE', [profileId])
    : await client.query('SELECT id, auth_subject, role FROM profiles WHERE lower(display_name)=lower($1) FOR UPDATE', [name.trim()]);
  if (profile.rowCount > 1) throw new Error('Display name is ambiguous; use a unique prepared profile.');
  if (profile.rowCount === 1 && (profile.rows[0].auth_subject || profile.rows[0].role !== role)) throw new Error('Profile is already linked or has a different role.');
  if (profile.rowCount === 0 && profileId) throw new Error('Profile ID was not found.');
  const existing = await client.query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [normalizedEmail]);
  if (existing.rowCount) throw Object.assign(new Error('Email is already provisioned.'), { code: 'EMAIL_TAKEN' });
  const userId = randomUUID();
  const passwordHash = await hashPassword(password);
  await client.query('INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,true,now(),now())', [userId, name.trim(), normalizedEmail]);
  await client.query('INSERT INTO account (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$2,\'credential\',$3,$4,now(),now())', [randomUUID(), userId, userId, passwordHash]);
  let targetProfileId;
  if (profile.rows[0]) {
    targetProfileId = profile.rows[0].id;
    await client.query('UPDATE profiles SET auth_subject=$1, job_title=COALESCE($2, job_title), updated_at=now() WHERE id=$3 AND auth_subject IS NULL', [userId, jobTitle, targetProfileId]);
  } else {
    targetProfileId = (await client.query('INSERT INTO profiles (display_name, role, job_title, auth_subject) VALUES ($1,$2,$3,$4) RETURNING id', [name.trim(), role, jobTitle, userId])).rows[0].id;
  }
  return { userId, profileId: targetProfileId };
}

/**
 * Creates a Better Auth user + credential account and links it to a prepared profile inside one
 * transaction. The caller (an authorised Leader/Admin request) is responsible for authorising this.
 * Kept for callers that only need provisioning (e.g. scripts/tests); the member API uses
 * provisionInTransaction so the profile insert commits atomically with the credential.
 */
export async function provisionAuthUser({ client, email, name, role, profileId, password, jobTitle = null }) {
  await client.query('BEGIN');
  try {
    const result = await provisionInTransaction({ client, email, name, role, profileId, password, jobTitle });
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}

/**
 * Revokes every active Better Auth session for a profile's auth subject.
 * Used when an account is deactivated so existing cookies stop being accepted.
 */
export async function revokeSessions(client, profileId) {
  const subject = await client.query('SELECT auth_subject FROM profiles WHERE id=$1', [profileId]);
  if (!subject.rows[0]?.auth_subject) return 0;
  const result = await client.query('DELETE FROM "session" WHERE "userId"=$1', [subject.rows[0].auth_subject]);
  return result.rowCount;
}
