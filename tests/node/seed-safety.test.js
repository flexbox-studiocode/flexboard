import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { assertSafeDevelopmentTarget } from '../../server/db/safety.js';

function runSeed(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--env-file=.env', 'scripts/db.mjs', 'seed'], { env: { ...process.env, ...env }, cwd: process.cwd() });
    let output = '';
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => resolve({ code, output }));
  });
}

test('integration target rejects production and remote databases', () => {
  assert.throws(() => assertSafeDevelopmentTarget('postgresql://user:password@127.0.0.1:5432/flexboard_db', 'production'), /disabled in production/);
  assert.throws(() => assertSafeDevelopmentTarget('postgresql://user:password@example.com:5432/flexboard_db', 'test'), /loopback database host/);
  assert.throws(() => assertSafeDevelopmentTarget('postgresql://user:password@127.0.0.1:5432/other_db', 'test'), /approved development database/);
});

test('seed rejects production explicitly', async () => {
  const result = await runSeed({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://USER:PASSWORD@127.0.0.1:5432/flexboard_db' });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Seed requires NODE_ENV=development/);
});

test('seed rejects non-development database targets', async () => {
  const result = await runSeed({ NODE_ENV: 'development', DATABASE_URL: 'postgresql://USER:PASSWORD@127.0.0.1:5432/other_db' });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Seed target must be a development database/);
});
