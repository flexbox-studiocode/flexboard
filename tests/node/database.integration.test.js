import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pg from 'pg';
import { closePool } from '../../server/db/pool.js';
import { migrate, migrationStatus } from '../../server/db/migrations.js';
import { assertSafeDevelopmentTarget } from '../../server/db/safety.js';

const { Pool } = pg;
const sourceUrl = process.env.DATABASE_URL;
const source = sourceUrl ? new URL(sourceUrl) : null;
const canRun = Boolean(sourceUrl) && process.env.NODE_ENV !== 'production';
const testDatabase = `flexboard_test_${randomUUID().replaceAll('-', '')}`;
const testUrl = source ? new URL(sourceUrl) : null;
if (testUrl) { testUrl.pathname = `/${testDatabase}`; }

async function maintenancePool() {
  if (!source) return null;
  const url = new URL(sourceUrl);
  url.pathname = '/postgres';
  return new Pool({ connectionString: url.toString() });
}

const integration = canRun ? test : test.skip;
integration('PostgreSQL migration, constraints, rollback, and seed isolation', async () => {
  const safeSource = assertSafeDevelopmentTarget(sourceUrl, process.env.NODE_ENV);
  const admin = await maintenancePool();
  let db;
  const failedMigration = path.resolve(`migrations/999_test_failure_${randomUUID()}.sql`);
  let testError;
  try {
    await admin.query(`CREATE DATABASE "${testDatabase}"`);
    process.env.DATABASE_URL = testUrl.toString();
    assert.equal(safeSource.hostname, source.hostname);
    process.env.NODE_ENV = 'test';
    await closePool();
    await migrate();
    const first = await migrationStatus();
    assert.equal(first.applied.length, 1);
    await migrate();
    const second = await migrationStatus();
    assert.equal(second.applied.length, first.applied.length);

    db = new Pool({ connectionString: testUrl.toString() });
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)", [['profiles','projects','project_members','tasks','task_assignees','checklist_items','task_updates','activity_logs']]);
    assert.equal(tables.rowCount, 8);
    const profile = await db.query("INSERT INTO profiles (display_name) VALUES ('Integration Fixture') RETURNING id");
    const project = await db.query("INSERT INTO projects (name, created_by) VALUES ('Integration Project', $1) RETURNING id", [profile.rows[0].id]);
    const task = await db.query("INSERT INTO tasks (project_id, title, created_by) VALUES ($1, 'Integration Task', $2) RETURNING id", [project.rows[0].id, profile.rows[0].id]);
    await assert.rejects(db.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2), ($1, $2)", [project.rows[0].id, profile.rows[0].id]));
    await assert.rejects(db.query("INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2), ($1, $2)", [task.rows[0].id, profile.rows[0].id]));
    await assert.rejects(db.query("INSERT INTO tasks (project_id, title, created_by, weight) VALUES ($1, 'Bad weight', $2, 0)", [project.rows[0].id, profile.rows[0].id]));
    await assert.rejects(db.query("INSERT INTO tasks (project_id, title, created_by) VALUES ($1, 'Bad creator', $2)", [project.rows[0].id, randomUUID()]));

    const failedName = path.basename(failedMigration);
    await fs.writeFile(failedMigration, 'CREATE TABLE migration_should_rollback (id integer); SELECT 1/0;');
    await assert.rejects(migrate(), new RegExp(`Migration ${failedName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')} failed`));
    const failedTable = await db.query("SELECT to_regclass('public.migration_should_rollback') AS name");
    assert.equal(failedTable.rows[0].name, null);
    const failedRecord = await db.query('SELECT 1 FROM schema_migrations WHERE version=$1', [failedName]);
    assert.equal(failedRecord.rowCount, 0);
  } catch (error) {
    testError = error;
    throw error;
  } finally {
    const cleanupErrors = [];
    try { await fs.rm(failedMigration, { force: true }); } catch (error) { cleanupErrors.push(error); }
    try { await db?.end(); } catch (error) { cleanupErrors.push(error); }
    try { await closePool(); } catch (error) { cleanupErrors.push(error); }
    try { await admin?.query(`DROP DATABASE IF EXISTS "${testDatabase}" WITH (FORCE)`); } catch (error) { cleanupErrors.push(error); }
    try { await admin?.end(); } catch (error) { cleanupErrors.push(error); }
    if (sourceUrl) process.env.DATABASE_URL = sourceUrl;
    // eslint-disable-next-line no-unsafe-finally
    if (cleanupErrors.length && !testError) throw new AggregateError(cleanupErrors, 'Database integration cleanup failed');
    if (cleanupErrors.length) console.error(`Database integration cleanup also failed: ${cleanupErrors[0].message}`);
  }
});
