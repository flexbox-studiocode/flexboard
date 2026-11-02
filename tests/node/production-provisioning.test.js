import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  assertProductionProvisioningTarget,
  assertProvisioningName,
  assertProvisioningPassword,
  assertProvisioningRole,
  normalizeProvisioningEmail
} from '../../server/db/production-target.js';

const SCRIPT = fileURLToPath(new URL('../../scripts/provision-production-users.mjs', import.meta.url));
const NEON = 'postgresql://USER:SUPERSECRET@ep-abc-pooler.c-3.ap-southeast-1.aws.neon.tech/flexboard_prod?sslmode=require';

function runScript(env, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { ...process.env, NODE_ENV: 'test', VERCEL: '', DATABASE_URL: '', ...env },
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => resolve({ code, output }));
  });
}

test('accepts the Neon production target and returns a redacted summary', () => {
  const target = assertProductionProvisioningTarget(NEON);
  assert.equal(target.database, 'flexboard_prod');
  assert.equal(target.host, 'ep-abc-pooler.c-3.ap-southeast-1.aws.neon.tech');
  assert.ok(!JSON.stringify(target).includes('SUPERSECRET'));
});

test('rejects missing and malformed DATABASE_URL', () => {
  assert.throws(() => assertProductionProvisioningTarget(''), /DATABASE_URL wajib/);
  assert.throws(() => assertProductionProvisioningTarget('not a url'), /tidak valid/);
});

test('rejects local, non-Neon, and wrong-database targets', () => {
  assert.throws(() => assertProductionProvisioningTarget('postgresql://user:pass@localhost:5432/flexboard_prod'), /Neon/);
  assert.throws(() => assertProductionProvisioningTarget('postgresql://user:pass@127.0.0.1:5432/flexboard_db'), /Neon/);
  assert.throws(() => assertProductionProvisioningTarget('postgresql://user:pass@db.example.com/flexboard_prod'), /Neon/);
  assert.throws(() => assertProductionProvisioningTarget(NEON.replace('flexboard_prod', 'flexboard_db')), /flexboard_prod/);
  assert.throws(() => assertProductionProvisioningTarget(NEON.replace('flexboard_prod', 'neondb')), /flexboard_prod/);
  assert.throws(() => assertProductionProvisioningTarget(NEON.replace('flexboard_prod', '')), /flexboard_prod/);
});

test('rejects emails that are not ending in a real Neon suffix', () => {
  // Guard against suffix tricks like "evil.neon.tech.attacker.com".
  assert.throws(() => assertProductionProvisioningTarget('postgresql://u:p@evil.neon.tech.attacker.com/flexboard_prod'), /Neon/);
  assert.throws(() => assertProductionProvisioningTarget('postgresql://u:p@neon.tech.attacker.com/flexboard_prod'), /Neon/);
});

test('normalises and validates emails', () => {
  assert.equal(normalizeProvisioningEmail('  Leader@FlexBoard.IO '), 'leader@flexboard.io');
  for (const bad of ['', 'no-at-sign', 'a@b', '@example.com', 'spaces in@example.com']) {
    assert.throws(() => normalizeProvisioningEmail(bad), /Format email/);
  }
});

test('only leader and member roles are allowed', () => {
  assert.equal(assertProvisioningRole('leader'), 'leader');
  assert.equal(assertProvisioningRole('member'), 'member');
  assert.throws(() => assertProvisioningRole('admin'), /tidak diizinkan/);
  assert.throws(() => assertProvisioningRole('Leader'), /tidak diizinkan/);
  assert.throws(() => assertProvisioningRole(''), /tidak diizinkan/);
});

test('passwords must be at least 8 characters', () => {
  assert.equal(assertProvisioningPassword('12345678'), '12345678');
  assert.throws(() => assertProvisioningPassword('1234567'), /minimal 8/);
  assert.throws(() => assertProvisioningPassword(''), /minimal 8/);
  assert.throws(() => assertProvisioningPassword(undefined), /minimal 8/);
});

test('display name must be present', () => {
  assert.equal(assertProvisioningName('  Kiandra  '), 'Kiandra');
  assert.throws(() => assertProvisioningName('   '), /wajib/);
});

test('script refuses to run when DATABASE_URL is missing', async () => {
  const result = await runScript({ DATABASE_URL: '' });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /DATABASE_URL wajib/);
});

test('script refuses local and non-Neon databases before prompting', async () => {
  const local = await runScript({ DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/flexboard_prod' });
  assert.notEqual(local.code, 0);
  assert.match(local.output, /Neon/);

  const wrongDb = await runScript({ DATABASE_URL: NEON.replace('flexboard_prod', 'flexboard_dev') });
  assert.notEqual(wrongDb.code, 0);
  assert.match(wrongDb.output, /flexboard_prod/);
});

test('script never prints the database password or connection string', async () => {
  const results = await Promise.all([
    runScript({ DATABASE_URL: NEON }),
    runScript({ DATABASE_URL: NEON.replace('flexboard_prod', 'flexboard_db') }),
    runScript({ DATABASE_URL: 'postgresql://user:SUPERSECRET@localhost/flexboard_prod' })
  ]);
  for (const result of results) {
    assert.ok(!result.output.includes('SUPERSECRET'));
    assert.ok(!result.output.includes('sslmode=require'));
    assert.ok(!/postgres(ql)?:\/\//.test(result.output));
  }
});

test('script refuses to run inside Vercel runtime', async () => {
  const result = await runScript({ DATABASE_URL: NEON, VERCEL: '1' });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Vercel/);
});
