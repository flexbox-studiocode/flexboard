import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { verifyPassword } from 'better-auth/crypto';
import { closePool, getPool } from '../../server/db/pool.js';
import { migrate } from '../../server/db/migrations.js';
import { provisionAuthUser } from '../../server/provisioning.js';

const { Pool } = pg;
const sourceUrl = process.env.DATABASE_URL;
const integration = sourceUrl && process.env.NODE_ENV !== 'production' ? test : test.skip;

integration('Better Auth email/password session lifecycle and profile mapping', async () => {
  const testDatabase = `flexboard_auth_test_${Date.now()}_${process.pid}`;
  const testUrl = new URL(sourceUrl);
  testUrl.pathname = `/${testDatabase}`;
  const adminUrl = new URL(sourceUrl);
  adminUrl.pathname = '/postgres';
  const admin = new Pool({ connectionString: adminUrl.toString() });
  let pool;
  try {
    await admin.query(`CREATE DATABASE "${testDatabase}"`);
    process.env.DATABASE_URL = testUrl.toString();
    await closePool();
    await migrate();
    const { auth } = await import('../../server/auth.js');
    pool = getPool();
    const email = `auth-test-${Date.now()}@example.test`;
    const profile = await pool.query("INSERT INTO profiles (display_name, role, is_active) VALUES ('Auth Integration Fixture', 'member', true) RETURNING id");
    const client = await pool.connect();
    try {
      await provisionAuthUser({ client, email, name: 'Auth Integration Fixture', role: 'member', profileId: profile.rows[0].id, password: 'correct horse battery staple' });
    } finally { client.release(); }
    const mapped = await pool.query('SELECT auth_subject, role FROM profiles WHERE id=$1', [profile.rows[0].id]);
    assert.equal(mapped.rows[0].role, 'member');
    assert.ok(mapped.rows[0].auth_subject);
    const credential = await pool.query('SELECT password FROM account WHERE "userId"=$1 AND "providerId"=\'credential\'', [mapped.rows[0].auth_subject]);
    assert.equal(credential.rowCount, 1);
    assert.equal(await verifyPassword({ hash: credential.rows[0].password, password: 'correct horse battery staple' }), true);
    assert.equal(await verifyPassword({ hash: credential.rows[0].password, password: 'wrong password' }), false);
    await assert.rejects(auth.api.signInEmail({ body: { email, password: 'wrong password' } }));
    const result = await auth.api.signInEmail({ body: { email, password: 'correct horse battery staple' }, headers: new Headers() });
    assert.ok(result?.token);
    const activeSession = await pool.query('SELECT 1 FROM "session" WHERE token=$1 AND "userId"=$2', [result.token, mapped.rows[0].auth_subject]);
    assert.equal(activeSession.rowCount, 1);
    await auth.api.signOut({ headers: new Headers({ authorization: `Bearer ${result.token}` }) });
    const revokedSession = await pool.query('SELECT 1 FROM "session" WHERE token=$1', [result.token]);
    assert.equal(revokedSession.rowCount, 0);
    const afterLogout = await auth.api.getSession({ headers: new Headers({ authorization: `Bearer ${result.token}` }) });
    assert.equal(afterLogout, null);
    await pool.query('UPDATE profiles SET is_active=false WHERE id=$1', [profile.rows[0].id]);
    const inactiveSession = await auth.api.signInEmail({ body: { email, password: 'correct horse battery staple' }, headers: new Headers() });
    assert.ok(inactiveSession?.token);
    const inactiveProfile = await pool.query('SELECT is_active FROM profiles WHERE id=$1', [profile.rows[0].id]);
    assert.equal(inactiveProfile.rows[0].is_active, false);
    await auth.api.signOut({ headers: new Headers({ authorization: `Bearer ${inactiveSession.token}` }) });
    await pool.query('DELETE FROM profiles WHERE id=$1', [profile.rows[0].id]);
  } finally {
    await closePool();
    await admin.query(`DROP DATABASE IF EXISTS "${testDatabase}" WITH (FORCE)`);
    await admin.end();
    process.env.DATABASE_URL = sourceUrl;
  }
});
