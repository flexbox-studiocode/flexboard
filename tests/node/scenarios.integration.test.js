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

// Mirrors the required manual scenarios A–C end-to-end against an isolated database, so the
// Leader->project->task->multi-assignee->checklist-ownership flow is proven without touching
// the real development accounts.
integration('scenarios A–C: leader builds project+task, each member owns their checklist', async () => {
  const database = `flexboard_scenario_test_${randomUUID().replaceAll('-', '')}`;
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

    async function signIn(role, label) {
      const email = `${label.toLowerCase().replaceAll(/\s+/g, '-')}-${randomUUID()}@example.test`;
      const profile = await pool.query('INSERT INTO profiles (display_name, role) VALUES ($1,$2) RETURNING id', [label, role]);
      const client = await pool.connect();
      try { await provisionAuthUser({ client, email, name: label, role, profileId: profile.rows[0].id, password: 'correct horse battery staple' }); }
      finally { client.release(); }
      const signed = await auth.api.signInEmail({ body: { email, password: 'correct horse battery staple' }, headers: new Headers(), asResponse: true });
      assert.equal(signed.ok, true);
      return { id: profile.rows[0].id, cookie: signed.headers.get('set-cookie').split(';', 1)[0] };
    }

    const leader = await signIn('leader', 'Adit Leader');
    const kiandra = await signIn('member', 'Kiandra');
    const rainer = await signIn('member', 'Rainer');
    const fakhri = await signIn('member', 'Fakhri');
    const bima = await signIn('member', 'Bima');

    // ---- Scenario A: leader creates a project with category and three members ----
    const projectRes = await call(handler, 'POST', 'projects', leader.cookie, {
      name: 'Website Company Profile FlexBox',
      description: 'Situs profil perusahaan',
      category: 'corporate_enterprise',
      memberIds: [kiandra.id, rainer.id, fakhri.id],
    });
    assert.equal(projectRes.statusCode, 201);
    const project = projectRes.body.data.project;
    assert.equal(project.category, 'corporate_enterprise');
    const memberRows = await pool.query("SELECT user_id FROM project_members WHERE project_id=$1 AND project_role='member'", [project.id]);
    assert.equal(memberRows.rowCount, 3);
    const lead = await pool.query("SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2 AND project_role='lead'", [project.id, leader.id]);
    assert.equal(lead.rowCount, 1);
    // Project shows up in leader's list with its category + member count.
    const listed = (await call(handler, 'GET', 'projects', leader.cookie)).body.data.projects.find(p => p.id === project.id);
    assert.equal(listed.category, 'corporate_enterprise');
    assert.equal(listed.member_count, 4);

    // Non-member Bima cannot be assigned to the task (not in project).
    const bimaTask = await call(handler, 'POST', 'tasks', leader.cookie, { projectId: project.id, title: 'Bad', assigneeIds: [bima.id] });
    assert.equal(bimaTask.statusCode, 400);

    // ---- Scenario B: leader creates a task assigning all three, with per-member checklists ----
    const taskRes = await call(handler, 'POST', 'tasks', leader.cookie, {
      projectId: project.id,
      title: 'Pengembangan Website FlexBox',
      description: 'Kerjakan modul utama',
      dueAt: '2026-10-30',
      assigneeIds: [kiandra.id, rainer.id, fakhri.id],
      checklist: [
        { title: 'Tugas Kiandra', description: 'Selesaikan bagian backend.', assigneeId: kiandra.id },
        { title: 'Tugas Rainer', description: 'Selesaikan bagian frontend.', assigneeId: rainer.id },
        { title: 'Tugas Fakhri', description: 'Selesaikan desain UI/UX.', assigneeId: fakhri.id },
      ],
    });
    assert.equal(taskRes.statusCode, 201);
    const task = taskRes.body.data.task;
    // The due date is stored as a calendar day in a DATE column, never a timestamp.
    const dueRow = await pool.query('SELECT due_at FROM tasks WHERE id=$1', [task.id]);
    assert.equal(String(dueRow.rows[0].due_at).slice(0, 10), '2026-10-30');
    // Over the wire it serializes as an ISO date, so the client reads only the day.
    assert.equal(String(task.due_at).slice(0, 10), '2026-10-30');
    assert.equal(task.assignees.length, 3);
    assert.equal(task.checklist.length, 3);
    const checklistRows = await pool.query('SELECT title, assignee_id FROM checklist_items WHERE task_id=$1 ORDER BY sort_order', [task.id]);
    assert.deepEqual(checklistRows.rows.map(r => [r.title, r.assignee_id]), [
      ['Tugas Kiandra', kiandra.id], ['Tugas Rainer', rainer.id], ['Tugas Fakhri', fakhri.id],
    ]);

    // ---- Scenario C: each member completes only their own checklist ----
    for (const [member, ownTitle, otherTitle] of [
      [kiandra, 'Tugas Kiandra', 'Tugas Rainer'],
      [rainer, 'Tugas Rainer', 'Tugas Fakhri'],
      [fakhri, 'Tugas Fakhri', 'Tugas Kiandra'],
    ]) {
      const detail = await call(handler, 'GET', `tasks/${task.id}`, member.cookie);
      assert.equal(detail.statusCode, 200);
      const items = detail.body.data.task.checklist;
      const own = items.find(i => i.title === ownTitle);
      const other = items.find(i => i.title === otherTitle);
      assert.equal((await call(handler, 'PATCH', `tasks/${task.id}/checklist/${own.id}`, member.cookie, { completed: true })).statusCode, 200);
      // Completing someone else's checklist is forbidden.
      assert.equal((await call(handler, 'PATCH', `tasks/${task.id}/checklist/${other.id}`, member.cookie, { completed: true })).statusCode, 403);
      // Member can comment and report work.
      assert.equal((await call(handler, 'POST', `tasks/${task.id}/comments`, member.cookie, { body: 'Progres saya' })).statusCode, 201);
      assert.equal((await call(handler, 'POST', `tasks/${task.id}/updates`, member.cookie, { workSummary: 'Selesai bagian saya' })).statusCode, 201);
    }

    // Persistence: after all three complete their own item, progress is 100% and survives a reload.
    const finalDetail = (await call(handler, 'GET', `tasks/${task.id}`, leader.cookie)).body.data.task;
    const completedBy = new Set(finalDetail.checklist.filter(i => i.is_completed).map(i => i.completed_by));
    assert.equal(completedBy.size, 3);
    assert.equal(Number(finalDetail.completion_percent), 100);
    assert.equal((await call(handler, 'GET', `tasks/${task.id}/comments`, leader.cookie)).body.data.comments.length, 3);
    assert.equal((await call(handler, 'GET', `tasks/${task.id}/updates`, leader.cookie)).body.data.updates.length, 3);

    // ---- Changing project membership re-scopes who can be assigned ----
    const removeKiandra = await call(handler, 'PUT', `projects/${project.id}/members`, leader.cookie, { memberIds: [rainer.id, fakhri.id] });
    assert.equal(removeKiandra.statusCode, 200);
    const nowForbidden = await call(handler, 'PUT', `tasks/${task.id}/assignees`, leader.cookie, { userIds: [kiandra.id] });
    assert.equal(nowForbidden.statusCode, 400);

    // History is preserved: checklists owned by Kiandra are not silently deleted when she is
    // removed from the project; they remain as inactive-project-members' historical assignments.
    const stillThere = await pool.query('SELECT count(*)::int AS n FROM checklist_items WHERE task_id=$1 AND archived_at IS NULL', [task.id]);
    assert.equal(stillThere.rows[0].n, 3);
  } finally {
    await closePool();
    await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await admin.end();
    process.env.DATABASE_URL = sourceUrl;
  }
});
