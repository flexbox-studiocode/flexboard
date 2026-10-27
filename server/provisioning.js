import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

export async function provisionAuthUser({ client, email, name, role, profileId, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || !name.trim() || !['leader', 'member'].includes(role) || password.length < 8) throw new Error('Invalid provisioning input.');
  await client.query('BEGIN');
  try {
    const profile = profileId
      ? await client.query('SELECT id, auth_subject, role FROM profiles WHERE id=$1 FOR UPDATE', [profileId])
      : await client.query('SELECT id, auth_subject, role FROM profiles WHERE lower(display_name)=lower($1) FOR UPDATE', [name.trim()]);
    if (profile.rowCount > 1) throw new Error('Display name is ambiguous; use a unique prepared profile.');
    if (profile.rowCount === 1 && (profile.rows[0].auth_subject || profile.rows[0].role !== role)) throw new Error('Profile is already linked or has a different role.');
    if (profile.rowCount === 0 && profileId) throw new Error('Profile ID was not found.');
    const existing = await client.query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [normalizedEmail]);
    if (existing.rowCount) throw new Error('Email is already provisioned.');
    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    await client.query('INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,true,now(),now())', [userId, name.trim(), normalizedEmail]);
    await client.query('INSERT INTO account (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$2,\'credential\',$3,$4,now(),now())', [randomUUID(), userId, userId, passwordHash]);
    const targetProfileId = profile.rows[0]?.id || (await client.query('INSERT INTO profiles (display_name, role) VALUES ($1,$2) RETURNING id', [name.trim(), role])).rows[0].id;
    await client.query('UPDATE profiles SET auth_subject=$1, updated_at=now() WHERE id=$2 AND auth_subject IS NULL', [userId, targetProfileId]);
    await client.query('COMMIT');
    return userId;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
