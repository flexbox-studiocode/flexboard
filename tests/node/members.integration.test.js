import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pg from 'pg';
import { closePool, getPool } from '../../server/db/pool.js';
import { migrate } from '../../server/db/migrations.js';
import { provisionAuthUser } from '../../server/provisioning.js';

const { Pool } = pg;
const sourceUrl = process.env.DATABASE_URL;
// Only run against an isolated throwaway database; never the development or production target.
const integration = sourceUrl && process.env.NODE_ENV !== 'production' ? test : test.skip;

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

async function call(handler, method, path, cookie, body) {
  const res = response();
  await handler({ method, url: `/api/${path}`, headers: new Headers(cookie ? { cookie } : {}), body }, res);
  return res;
}

integration('member management: create, roles, authorization, deactivation, session invalidation', async () => {
  const database = `flexboard_members_test_${randomUUID().replaceAll('-', '')}`;
  const testUrl = new URL(sourceUrl); testUrl.pathname = `/${database}`;
  const adminUrl = new URL(sourceUrl); adminUrl.pathname = '/postgres';
  const admin = new Pool({ connectionString: adminUrl.toString() });
  let handler;
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
    process.env.DATABASE_URL = testUrl.toString();
    process.env.NODE_ENV = 'test';
    await closePool();
    await migrate();
    handler = (await import('../../api/domain.js')).default;
    const { auth } = await import('../../server/auth.js');
    const pool = getPool();

    // Provisions a user, signs in, and returns profile id + session cookie. The email is unique.
    async function signIn(role, label, password = 'correct horse battery staple') {
      const email = `${label.toLowerCase().replaceAll(/\s+/g, '-')}-${randomUUID()}@example.test`;
      const profile = await pool.query('INSERT INTO profiles (display_name, role, is_active) VALUES ($1,$2,true) RETURNING id', [label, role]);
      const client = await pool.connect();
      try { await provisionAuthUser({ client, email, name: label, role, profileId: profile.rows[0].id, password }); }
      finally { client.release(); }
      const signed = await auth.api.signInEmail({ body: { email, password }, headers: new Headers(), asResponse: true });
      assert.equal(signed.ok, true);
      return { id: profile.rows[0].id, email, password, cookie: signed.headers.get('set-cookie').split(';', 1)[0] };
    }

    const leader = await signIn('leader', 'Member Leader');
    const adminAccount = await signIn('admin', 'Member Admin');
    const member = await signIn('member', 'Member Plain');

    // ---- Authentication gate: no session -> 401 ----
    assert.equal((await call(handler, 'GET', 'members', null)).statusCode, 401);
    assert.equal((await call(handler, 'POST', 'members', null, { displayName: 'X', email: 'x@y.z', password: 'xxxxxxxx' })).statusCode, 401);

    // ---- Leader creates a member through the API (Better Auth + hashed password) ----
    const createBody = { displayName: 'Anggota Baru', email: `anggota-${randomUUID()}@example.test`, jobTitle: 'Backend Developer', role: 'member', password: 'rahasia12345', passwordConfirm: 'rahasia12345' };
    const created = await call(handler, 'POST', 'members', leader.cookie, createBody);
    assert.equal(created.statusCode, 201);
    const newMember = created.body.data.member;
    assert.equal(newMember.role, 'member');
    assert.equal(newMember.job_title, 'Backend Developer');
    // Password is never echoed back.
    assert.equal(JSON.stringify(created.body).includes('rahasia12345'), false);
    // A real Better Auth user + hashed credential exist.
    const authUser = await pool.query('SELECT id FROM "user" WHERE lower(email)=lower($1)', [createBody.email]);
    assert.equal(authUser.rowCount, 1);
    const credential = await pool.query('SELECT password FROM account WHERE "userId"=$1 AND "providerId"=\'credential\'', [authUser.rows[0].id]);
    assert.equal(credential.rowCount, 1);
    assert.notEqual(credential.rows[0].password, 'rahasia12345');
    // Audit log recorded.
    const auditCreate = await pool.query("SELECT 1 FROM activity_logs WHERE action='member.created' AND (metadata->>'profileId')=$1", [newMember.id]);
    assert.equal(auditCreate.rowCount, 1);

    // ---- Duplicate email -> 409 ----
    const dup = await call(handler, 'POST', 'members', leader.cookie, { ...createBody, displayName: 'Duplikat', email: createBody.email });
    assert.equal(dup.statusCode, 409);

    // ---- Unknown role -> 400/403 ----
    const badRole = await call(handler, 'POST', 'members', leader.cookie, { ...createBody, role: 'superuser', email: `r-${randomUUID()}@example.test` });
    assert.equal([400, 403].includes(badRole.statusCode), true);

    // ---- Weak password rejected ----
    assert.equal((await call(handler, 'POST', 'members', leader.cookie, { ...createBody, email: `w-${randomUUID()}@example.test`, password: 'short', passwordConfirm: 'short' })).statusCode, 400);

    // ---- Member cannot reach account-management endpoints -> 403 ----
    assert.equal((await call(handler, 'POST', 'members', member.cookie, { ...createBody, email: `m-${randomUUID()}@example.test` })).statusCode, 403);
    assert.equal((await call(handler, 'PATCH', `members/${newMember.id}`, member.cookie, { displayName: 'Hack' })).statusCode, 403);
    assert.equal((await call(handler, 'POST', `members/${newMember.id}/deactivate`, member.cookie, {})).statusCode, 403);
    // Member changing their own role -> 403.
    assert.equal((await call(handler, 'PATCH', `members/${member.id}`, member.cookie, { role: 'leader' })).statusCode, 403);

    // ---- Leader edits profile ----
    const edit = await call(handler, 'PATCH', `members/${newMember.id}`, leader.cookie, { displayName: 'Anggota Diperbarui', jobTitle: 'Senior Backend' });
    assert.equal(edit.statusCode, 200);
    assert.equal(edit.body.data.member.display_name, 'Anggota Diperbarui');
    assert.equal(edit.body.data.member.job_title, 'Senior Backend');

    // ---- Leader promotes member -> admin, DB reflects it ----
    const promote = await call(handler, 'PATCH', `members/${newMember.id}`, leader.cookie, { role: 'admin' });
    assert.equal(promote.statusCode, 200);
    assert.equal(promote.body.data.roleChanged, true);
    const roleRow = await pool.query('SELECT role FROM profiles WHERE id=$1', [newMember.id]);
    assert.equal(roleRow.rows[0].role, 'admin');
    assert.equal((await pool.query("SELECT 1 FROM activity_logs WHERE action='member.role_changed' AND (metadata->>'profileId')=$1", [newMember.id])).rowCount, 1);

    // ---- Leader demotes admin -> member ----
    const demote = await call(handler, 'PATCH', `members/${newMember.id}`, leader.cookie, { role: 'member' });
    assert.equal(demote.statusCode, 200);
    assert.equal((await pool.query('SELECT role FROM profiles WHERE id=$1', [newMember.id])).rows[0].role, 'member');

    // ---- Admin cannot touch a leader, nor grant admin/leader ----
    assert.equal((await call(handler, 'PATCH', `members/${leader.id}`, adminAccount.cookie, { role: 'member' })).statusCode, 403);
    assert.equal((await call(handler, 'PATCH', `members/${newMember.id}`, adminAccount.cookie, { role: 'admin' })).statusCode, 403);
    assert.equal((await call(handler, 'PATCH', `members/${adminAccount.id}`, adminAccount.cookie, { role: 'leader' })).statusCode, 403);
    // Admin cannot deactivate a leader.
    assert.equal((await call(handler, 'POST', `members/${leader.id}/deactivate`, adminAccount.cookie, {})).statusCode, 403);
    // Leader role is immutable even for a leader acting on itself/another leader.
    assert.equal((await call(handler, 'PATCH', `members/${leader.id}`, leader.cookie, { role: 'member' })).statusCode, 403);

    // ---- Invalid UUID -> 400 ----
    assert.equal((await call(handler, 'PATCH', 'members/not-a-uuid', leader.cookie, { displayName: 'X' })).statusCode, 400);
    assert.equal((await call(handler, 'POST', 'members/not-a-uuid/deactivate', leader.cookie, {})).statusCode, 400);

    // ---- Deactivate: existing sessions revoked, future sessions rejected, history retained ----
    // Give the new member a live session first so revocation is observable.
    // ---- Deactivate: session revoked, login rejected, history retained ----
    // Give the new member a live session first so revocation is observable.
    const victimLogin = await auth.api.signInEmail({ body: { email: createBody.email, password: 'rahasia12345' }, headers: new Headers(), asResponse: true });
    assert.equal(victimLogin.ok, true);
    const victimCookie = victimLogin.headers.get('set-cookie').split(';', 1)[0];
    assert.equal((await call(handler, 'GET', 'tasks', victimCookie)).statusCode, 200);

    const deactivated = await call(handler, 'POST', `members/${newMember.id}/deactivate`, leader.cookie, {});
    assert.equal(deactivated.statusCode, 200);
    assert.equal(deactivated.body.data.member.is_active, false);
    // The previously valid session is no longer accepted.
    assert.equal((await call(handler, 'GET', 'tasks', victimCookie)).statusCode, 401);
    // All sessions for that auth subject are gone.
    assert.equal((await pool.query('SELECT 1 FROM "session" WHERE "userId"=(SELECT auth_subject FROM profiles WHERE id=$1)', [newMember.id])).rowCount, 0);
    // Deactivated account cannot obtain a session that maps to an active profile.
    const relogin = await auth.api.signInEmail({ body: { email: createBody.email, password: 'rahasia12345' }, headers: new Headers(), asResponse: true });
    if (relogin.ok) {
      const cookie = relogin.headers.get('set-cookie').split(';', 1)[0];
      // Even if a token is minted, the domain API refuses it because the profile is inactive.
      assert.equal((await call(handler, 'GET', 'members', cookie)).statusCode, 401);
    }
    // Audit log + profile row retained (soft delete, no hard delete).
    assert.equal((await pool.query("SELECT 1 FROM activity_logs WHERE action='member.deactivated' AND (metadata->>'profileId')=$1", [newMember.id])).rowCount, 1);
    assert.equal((await pool.query('SELECT 1 FROM profiles WHERE id=$1', [newMember.id])).rowCount, 1);
    // Deactivated accounts disappear from active assignee/member listings.
    const activeList = (await call(handler, 'GET', 'members?status=active', leader.cookie)).body.data.members;
    assert.equal(activeList.some(m => m.id === newMember.id), false);
    // Cannot deactivate an already-inactive account twice (permissions.activate/deactivate guard).
    assert.equal((await call(handler, 'POST', `members/${newMember.id}/deactivate`, leader.cookie, {})).statusCode, 403);

    // ---- Reactivate: login works again, history retained ----
    const reactivated = await call(handler, 'POST', `members/${newMember.id}/activate`, leader.cookie, {});
    assert.equal(reactivated.statusCode, 200);
    assert.equal(reactivated.body.data.member.is_active, true);
    assert.equal((await pool.query("SELECT 1 FROM activity_logs WHERE action='member.activated' AND (metadata->>'profileId')=$1", [newMember.id])).rowCount, 1);
    const reLogin = await auth.api.signInEmail({ body: { email: createBody.email, password: 'rahasia12345' }, headers: new Headers(), asResponse: true });
    assert.equal(reLogin.ok, true);
    const reCookie = reLogin.headers.get('set-cookie').split(';', 1)[0];
    assert.equal((await call(handler, 'GET', 'tasks', reCookie)).statusCode, 200);

    // ---- List exposes permissions per target for the actor ----
    const list = (await call(handler, 'GET', 'members', leader.cookie)).body.data.members;
    const leaderRow = list.find(m => m.id === leader.id);
    const adminRow = list.find(m => m.id === adminAccount.id);
    assert.equal(leaderRow.permissions.changeRole, false);
    assert.equal(adminRow.permissions.changeRole, true);
  } finally {
    await closePool();
    await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await admin.end();
    process.env.DATABASE_URL = sourceUrl;
  }
});
