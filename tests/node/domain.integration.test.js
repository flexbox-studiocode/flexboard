import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pg from 'pg';
import { closePool, getPool } from '../../server/db/pool.js';
import { migrate } from '../../server/db/migrations.js';
import { provisionAuthUser } from '../../server/provisioning.js';

const { Pool } = pg;
const sourceUrl = process.env.DATABASE_URL;
const integration = sourceUrl && process.env.NODE_ENV !== 'production' ? test : test.skip;

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

async function call(handler, method, path, cookie, body) {
  const res = response();
  await handler({ method, url: `/api/${path}`, headers: new Headers(cookie ? { cookie } : {}), body }, res);
  return res;
}

integration('domain API end-to-end authorization, transactions, persistence, progress, and activity', async () => {
  const database = `flexboard_domain_test_${randomUUID().replaceAll('-', '')}`;
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
    const pool = getPool();

    async function user(role, label) {
      const email = `${label.toLowerCase().replaceAll(/\s+/g, '-')}-${Date.now()}-${randomUUID()}@example.test`;
      const profile = await pool.query('INSERT INTO profiles (display_name, role, is_active) VALUES ($1,$2,true) RETURNING id', [label, role]);
      const client = await pool.connect();
      try { await provisionAuthUser({ client, email, name: label, role, profileId: profile.rows[0].id, password: 'correct horse battery staple' }); }
      finally { client.release(); }
      const { auth } = await import('../../server/auth.js');
      const signed = await auth.api.signInEmail({ body: { email, password: 'correct horse battery staple' }, headers: new Headers(), asResponse: true });
      assert.equal(signed.ok, true);
      return { id: profile.rows[0].id, cookie: signed.headers.get('set-cookie').split(';', 1)[0] };
    }

    const leader = await user('leader', 'Domain Leader');
    const member = await user('member', 'Domain Member');
    const guest = await call(handler, 'GET', 'tasks', null);
    assert.equal(guest.statusCode, 401);

    const projectRes = await call(handler, 'POST', 'projects', leader.cookie, { name: 'Domain Project', description: 'API fixture' });
    assert.equal(projectRes.statusCode, 201);
    const project = projectRes.body.data.project;
    await pool.query('INSERT INTO project_members (project_id,user_id,project_role) VALUES ($1,$2,$3)', [project.id, member.id, 'member']);

    const taskRes = await call(handler, 'POST', 'tasks', leader.cookie, {
      projectId: project.id, title: 'Domain Task', assigneeIds: [member.id], checklist: [{ title: 'First', assigneeId: member.id }, { title: 'Second' }], weight: 2,
    });
    assert.equal(taskRes.statusCode, 201);
    const task = taskRes.body.data.task;
    const fixture = await pool.query('SELECT (SELECT count(*) FROM project_members WHERE project_id=$1) members, (SELECT count(*) FROM task_assignees WHERE task_id=$2) assignees, (SELECT count(*) FROM checklist_items WHERE task_id=$2) checklist', [project.id, task.id]);
    assert.deepEqual(fixture.rows[0], { members: '2', assignees: '1', checklist: '2' });

    // Contract: list payload exposes project name, assignee identities with role, and derived checklist progress.
    const projectList = (await call(handler, 'GET', 'projects', leader.cookie)).body.data.projects;
    const listedProject = projectList.find(row => row.id === project.id);
    assert.equal(listedProject.category, null);
    assert.equal(listedProject.member_count, 2);

    const taskList = (await call(handler, 'GET', 'tasks', leader.cookie)).body.data.tasks;
    const listedTask = taskList.find(row => row.id === task.id);
    assert.equal(listedTask.project_name, 'Domain Project');
    assert.deepEqual(listedTask.assignees, [{ id: member.id, name: 'Domain Member', role: 'member' }]);
    assert.equal(listedTask.checklist_count, 2);
    assert.equal(listedTask.completed_checklist, 0);
    assert.equal(listedTask.completion_percent, '0.00');

    const invalid = await call(handler, 'POST', 'tasks', leader.cookie, { projectId: project.id, title: '', weight: 0 });
    assert.equal(invalid.statusCode, 400);
    const noChecklistTask = await call(handler, 'POST', 'tasks', leader.cookie, { projectId: project.id, title: 'No Checklist' });
    assert.equal(noChecklistTask.statusCode, 201);

    for (const [method, path, body] of [['POST', 'projects', { name: 'Denied' }], ['POST', 'tasks', { projectId: project.id, title: 'Denied' }], ['PUT', `tasks/${task.id}/assignees`, { userIds: [] }], ['POST', `tasks/${task.id}/archive`, {}]]) {
      assert.equal((await call(handler, method, path, member.cookie, body)).statusCode, 403);
    }
    const detail = await call(handler, 'GET', `tasks/${task.id}`, member.cookie);
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.body.data.task.project_name, 'Domain Project');
    assert.deepEqual(detail.body.data.task.assignees, [{ id: member.id, name: 'Domain Member', role: 'member' }]);
    const firstDetailItem = detail.body.data.task.checklist.find(item => item.title === 'First');
    assert.equal(firstDetailItem.assignee_name, 'Domain Member');
    assert.equal(detail.body.data.task.checklist.length, 2);
    assert.equal(detail.body.data.task.progress, detail.body.data.task.completion_percent);

    const items = (await call(handler, 'GET', `tasks/${task.id}/checklists`, member.cookie)).body.data.items;
    assert.equal(items.length, 2);
    assert.equal((await call(handler, 'PATCH', `tasks/${task.id}/checklist/${items[0].id}`, member.cookie, { completed: true })).statusCode, 200);
    assert.equal((await call(handler, 'PATCH', `tasks/${task.id}/checklist/${items[1].id}`, member.cookie, { completed: true })).statusCode, 403);
    // Members may not add checklist items; only managers may edit the checklist structure.
    const added = await call(handler, 'POST', `tasks/${task.id}/checklists`, member.cookie, { items: [{ title: 'Third' }] });
    assert.equal(added.statusCode, 403);
    assert.equal((await call(handler, 'POST', `tasks/${task.id}/comments`, member.cookie, { body: 'Member comment' })).statusCode, 201);
    assert.equal((await call(handler, 'POST', `tasks/${task.id}/updates`, member.cookie, { workSummary: 'Member update', blockers: 'None' })).statusCode, 201);
    assert.equal((await call(handler, 'GET', `tasks/${task.id}/comments`, leader.cookie)).body.data.comments.length, 1);
    assert.equal((await call(handler, 'GET', `tasks/${task.id}/updates`, leader.cookie)).body.data.updates.length, 1);

    const progress = (await call(handler, 'GET', 'progress/team', member.cookie)).body.data.progress;
    const calculated = progress.find(row => row.id === task.id);
    const empty = progress.find(row => row.title === 'No Checklist');
    assert.equal(calculated.completion_percent, '50.00');
    assert.equal(empty.completion_percent, null);
    assert.equal(empty.progress_unavailable_reason, 'NO_ACTIVE_CHECKLIST');

    // Contract: PATCH checklist syncs transactionally, preserving ids and completion state, updating kept rows,
    // inserting new ones, and soft-deleting omitted items instead of hard deleting them.
    const beforeSync = (await call(handler, 'GET', `tasks/${task.id}`, leader.cookie)).body.data.task.checklist;
    const firstItem = beforeSync.find(item => item.title === 'First');
    const secondItem = beforeSync.find(item => item.title === 'Second');
    assert.equal(firstItem.is_completed, true);
    const sync = await call(handler, 'PATCH', `tasks/${task.id}`, leader.cookie, { checklist: [
      { id: secondItem.id, title: 'Second renamed', description: 'Updated', assigneeId: member.id, sortOrder: 0 },
      { title: 'Fourth', assigneeId: member.id, sortOrder: 1 },
    ] });
    assert.equal(sync.statusCode, 200);
    const afterSync = await call(handler, 'GET', `tasks/${task.id}/checklists`, leader.cookie);
    assert.equal(afterSync.statusCode, 200);
    const active = afterSync.body.data.items;
    assert.equal(active.length, 2);
    assert.deepEqual(active.map(item => item.title), ['Second renamed', 'Fourth']);
    assert.equal(active[0].id, secondItem.id);
    assert.equal(active[0].description, 'Updated');
    assert.equal(active[0].assignee_id, member.id);
    const archivedFirst = await pool.query('SELECT archived_at FROM checklist_items WHERE id=$1', [firstItem.id]);
    assert.ok(archivedFirst.rows[0].archived_at instanceof Date);
    const createdThird = await pool.query('SELECT count(*)::int AS n FROM checklist_items WHERE task_id=$1 AND title=$2', [task.id, 'Third']);
    assert.equal(createdThird.rows[0].n, 0);
    // Completed state on the retained row survives the sync rather than being reset by the edit.
    assert.equal(active[0].is_completed, false);
    assert.equal(firstItem.is_completed, true);
    const activityAfterSync = await pool.query("SELECT metadata FROM activity_logs WHERE task_id=$1 AND action='task.updated' ORDER BY created_at DESC LIMIT 1", [task.id]);
    // Before this sync there were two active items (First, Second). The payload keeps Second (by id)
    // and adds Fourth, so only First is soft-deleted. "Third" was never created because the earlier
    // member POST was rejected (403), so archived must be 1, not 2.
    assert.equal(activityAfterSync.rows[0].metadata.checklist.archived, 1);

    // Authorization is unchanged: members cannot rewrite task fields or the checklist structure.
    assert.equal((await call(handler, 'PATCH', `tasks/${task.id}`, member.cookie, { checklist: [] })).statusCode, 403);
    // Checklist assignees must be active task assignees, not arbitrary project members.
    const stranger = await user('member', 'Domain Stranger');
    await pool.query('INSERT INTO project_members (project_id,user_id,project_role) VALUES ($1,$2,$3)', [project.id, stranger.id, 'member']);
    const badAssignee = await call(handler, 'PATCH', `tasks/${task.id}`, leader.cookie, { checklist: [{ title: 'Bad', assigneeId: stranger.id }] });
    assert.equal(badAssignee.statusCode, 400);
    const stillActive = (await call(handler, 'GET', `tasks/${task.id}/checklists`, leader.cookie)).body.data.items;
    assert.equal(stillActive.length, 2);

    const archive = await call(handler, 'POST', `tasks/${task.id}/archive`, leader.cookie, {});
    assert.equal(archive.statusCode, 200);
    const history = await pool.query("SELECT action FROM activity_logs WHERE task_id=$1 ORDER BY created_at", [task.id]);
    assert.ok(history.rows.some(row => row.action === 'task.created'));
    assert.ok(history.rows.some(row => row.action === 'comment.created'));
    assert.ok(history.rows.some(row => row.action === 'update.created'));
    assert.ok(history.rows.some(row => row.action === 'task.archived'));
    assert.equal((await call(handler, 'GET', 'activity', member.cookie)).statusCode, 200);
  } finally {
    await closePool();
    await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await admin.end();
    process.env.DATABASE_URL = sourceUrl;
  }
});
