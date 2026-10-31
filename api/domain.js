import { randomUUID } from "node:crypto";
import { getPool } from "../server/db/pool.js";
import {
  requireUser,
  canReadProject,
  canReadTask,
  canUpdateChecklist,
  isManager,
  isLeader,
  rankOf,
} from "../server/authorization.js";
import { capabilities } from "../server/auth.js";
import {
  provisionInTransaction,
  revokeSessions,
} from "../server/provisioning.js";

const ROLES = ["leader", "admin", "member"];
const json = (res, status, data) =>
  res.status(status).json(status >= 400 ? { error: data } : { data });
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const body = (req) =>
  req.body && typeof req.body === "object" ? req.body : {};
const fail = (message, status = 400, code = "VALIDATION_ERROR") => {
  throw Object.assign(new Error(message), { status, code });
};
const uuid = (v, name) => {
  if (!UUID.test(String(v || ""))) fail(`${name} is invalid.`);
  return v;
};
const text = (v, name, max = 5000) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail(`${name} is required.`);
  return v.trim();
};
// Tenggat is a calendar day. Accept ISO date (YYYY-MM-DD) or a legacy ISO datetime and keep only the day.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const dueDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") fail("dueAt is invalid.");
  const candidate = value.slice(0, 10);
  if (
    !DATE_ONLY.test(candidate) ||
    Number.isNaN(Date.parse(`${candidate}T00:00:00Z`))
  )
    fail("dueAt is invalid.");
  return candidate;
};
const categories = [
  "corporate_enterprise",
  "startup_sme",
  "government_public",
  "educational_community",
];
const statuses = ["todo", "in_progress", "in_review", "done", "archived"];
const priorities = ["low", "medium", "high"];

async function log(c, user, projectId, taskId, action, metadata = {}) {
  await c.query(
    "INSERT INTO activity_logs(actor_id,project_id,task_id,action,metadata) VALUES($1,$2,$3,$4,$5)",
    [user.id, projectId, taskId, action, metadata],
  );
}
// Account-level audit trail. project_id/task_id stay NULL because these actions are not project-scoped.
async function accountLog(c, user, action, metadata) {
  await c.query(
    "INSERT INTO activity_logs(actor_id,action,metadata) VALUES($1,$2,$3)",
    [user.id, action, metadata],
  );
}
async function taskProject(pool, taskId) {
  const r = await pool.query("SELECT project_id FROM tasks WHERE id=$1", [
    taskId,
  ]);
  return r.rows[0]?.project_id;
}
const memberShape = `p.id,p.display_name,p.job_title,p.role,p.is_active,p.created_at,p.updated_at`;

// An active checklist assignee must be an active task assignee AND an active project member.
// Checking both scopes keeps checklist ownership consistent with task/project membership.
async function assertChecklistAssignee(c, taskId, projectId, assigneeId) {
  const valid = await c.query(
    "SELECT 1 FROM task_assignees ta JOIN profiles p ON p.id=ta.user_id JOIN project_members pm ON pm.project_id=$1 AND pm.user_id=ta.user_id WHERE ta.task_id=$2 AND ta.user_id=$3 AND p.is_active=true",
    [projectId, taskId, assigneeId],
  );
  if (!valid.rowCount)
    fail(
      "Checklist assignee must be an active task assignee and project member.",
    );
}
// Transactional checklist sync that preserves item identity so completed state and history survive edits.
// Existing ids are updated in place, new rows are inserted, and omitted rows are soft-deleted via archived_at.
// Assignees are validated against the task's current assignees and the project's active members inside the same transaction.
async function syncChecklist(c, taskId, projectId, items, userId) {
  const listed = await c.query(
    "SELECT id,is_completed FROM checklist_items WHERE task_id=$1 AND archived_at IS NULL",
    [taskId],
  );
  const existing = new Map(listed.rows.map((row) => [row.id, row]));
  const seen = new Set(),
    kept = [];
  const validated = new Set();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const assignee = item.assigneeId ?? item.assignee_id ?? null;
    if (assignee !== null) {
      uuid(assignee, "assigneeId");
      if (!validated.has(assignee)) {
        await assertChecklistAssignee(c, taskId, projectId, assignee);
        validated.add(assignee);
      }
    }
    const title = text(item.title, "title", 500);
    const description =
      typeof item.description === "string"
        ? item.description.trim() || null
        : null;
    const sortOrder = Number.isInteger(item.sortOrder) ? item.sortOrder : i;
    let id = item.id ?? null;
    if (id !== null) {
      uuid(id, "itemId");
      if (seen.has(id)) fail("Checklist item ids must be unique.");
      seen.add(id);
    }
    if (id !== null && existing.has(id)) {
      const row = await c.query(
        "UPDATE checklist_items SET title=$1,description=$2,assignee_id=$3,sort_order=$4,updated_at=now() WHERE id=$5 AND task_id=$6 AND archived_at IS NULL RETURNING *",
        [title, description, assignee, sortOrder, id, taskId],
      );
      kept.push(row.rows[0]);
    } else if (id !== null) {
      // A client-supplied id that is not an active item of this task may be a soft-deleted row being restored.
      // Rows already owned by this task are reactivated; any id belonging to another task is rejected.
      const owned = await c.query(
        "SELECT id FROM checklist_items WHERE id=$1 AND task_id=$2",
        [id, taskId],
      );
      if (owned.rowCount) {
        const row = await c.query(
          "UPDATE checklist_items SET title=$1,description=$2,assignee_id=$3,sort_order=$4,archived_at=NULL,is_completed=false,completed_by=NULL,completed_at=NULL,updated_at=now() WHERE id=$5 AND task_id=$6 RETURNING *",
          [title, description, assignee, sortOrder, id, taskId],
        );
        kept.push(row.rows[0]);
      } else {
        kept.push(
          (
            await c.query(
              "INSERT INTO checklist_items(id,task_id,title,description,assignee_id,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
              [id, taskId, title, description, assignee, sortOrder, userId],
            )
          ).rows[0],
        );
      }
    } else {
      kept.push(
        (
          await c.query(
            "INSERT INTO checklist_items(task_id,title,description,assignee_id,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            [taskId, title, description, assignee, sortOrder, userId],
          )
        ).rows[0],
      );
    }
  }
  const removed = [...existing.keys()].filter((id) => !seen.has(id));
  if (removed.length)
    await c.query(
      "UPDATE checklist_items SET archived_at=now(),updated_at=now() WHERE task_id=$1 AND id=ANY($2::uuid[]) AND archived_at IS NULL",
      [taskId, removed],
    );
  return { kept, removed };
}
// Derived checklist progress. No stored percentage exists, so completion is always computed from active items.
const CHECKLIST_PROGRESS = `(SELECT count(*) FROM checklist_items c WHERE c.task_id=t.id AND c.archived_at IS NULL)::int AS checklist_count,(SELECT count(*) FROM checklist_items c WHERE c.task_id=t.id AND c.archived_at IS NULL AND c.is_completed)::int AS completed_checklist,CASE WHEN (SELECT count(*) FROM checklist_items c WHERE c.task_id=t.id AND c.archived_at IS NULL)=0 THEN NULL ELSE ROUND((SELECT count(*) FROM checklist_items c WHERE c.task_id=t.id AND c.archived_at IS NULL AND c.is_completed)::numeric/(SELECT count(*) FROM checklist_items c WHERE c.task_id=t.id AND c.archived_at IS NULL)*100,2) END AS completion_percent`;
const checklistItems = `COALESCE((SELECT json_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'is_completed',c.is_completed,'completed_by',c.completed_by,'completed_at',c.completed_at,'sort_order',c.sort_order,'assignee_id',c.assignee_id,'assignee_name',ap.display_name,'created_by',c.created_by,'created_at',c.created_at,'updated_at',c.updated_at) ORDER BY c.sort_order,c.id) FROM checklist_items c LEFT JOIN profiles ap ON ap.id=c.assignee_id WHERE c.task_id=t.id AND c.archived_at IS NULL),'[]') AS checklist`;
const TASK_SELECT = `SELECT t.*,pr.name AS project_name,COALESCE(json_agg(DISTINCT jsonb_build_object('id',p.id,'name',p.display_name,'role',p.role)) FILTER(WHERE p.id IS NOT NULL),'[]') assignees,${checklistItems},${CHECKLIST_PROGRESS} FROM tasks t JOIN projects pr ON pr.id=t.project_id LEFT JOIN task_assignees a ON a.task_id=t.id LEFT JOIN profiles p ON p.id=a.user_id`;

function validateTaskFields(b, partial = false) {
  if (!partial || "title" in b) text(b.title, "title", 300);
  if ("status" in b && !statuses.includes(b.status)) fail("status is invalid.");
  if ("priority" in b && !priorities.includes(b.priority))
    fail("priority is invalid.");
  if (
    "weight" in b &&
    (!Number.isFinite(Number(b.weight)) || Number(b.weight) <= 0)
  )
    fail("weight is invalid.");
  if ("dueAt" in b) dueDate(b.dueAt);
}

// ---------------------------------------------------------------------------
// Member / account management helpers
// ---------------------------------------------------------------------------

/** Can `actor` change `target` to `nextRole`? Prevents privilege escalation server-side. */
function assertRoleChangeAllowed(actor, target, nextRole) {
  if (!ROLES.includes(nextRole)) fail("role is invalid.");
  if (target.role === "leader")
    fail("Leader role cannot be changed.", 403, "FORBIDDEN");
  if (!isManager(actor))
    fail("Managing roles requires manager privileges.", 403, "FORBIDDEN");
  // Admins may only move members between member and admin — never grant themselves/others leader,
  // and never modify another admin or a leader. Only leaders may alter admins or grant admin.
  if (!isLeader(actor)) {
    if (target.role === "admin")
      fail("Only a leader can change another admin.", 403, "FORBIDDEN");
    if (nextRole === "admin")
      fail("Only a leader can grant admin.", 403, "FORBIDDEN");
    if (nextRole === "leader")
      fail("Only a leader can grant leader.", 403, "FORBIDDEN");
  }
  if (
    nextRole === "leader" &&
    actor.id === target.id &&
    actor.role !== "leader"
  )
    fail("Cannot promote self to leader.", 403, "FORBIDDEN");
}

/** Describes which account actions the actor may take on a target profile, for UI + enforcement. */
function memberPermissions(actor, target) {
  const actorRank = rankOf(actor.role);
  const isSelf = actor.id === target.id;
  const targetIsLeader = target.role === "leader";
  const canEditProfile =
    isManager(actor) &&
    !targetIsLeader &&
    (isLeader(actor) || target.role === "member");
  const canChangeRole = isLeader(actor) && !targetIsLeader && !isSelf;
  const canDeactivate =
    isManager(actor) &&
    !targetIsLeader &&
    !isSelf &&
    (isLeader(actor) || target.role === "member");
  return {
    edit: canEditProfile,
    changeRole: canChangeRole,
    deactivate: canDeactivate && target.is_active,
    activate: canDeactivate && !target.is_active,
    actorRank,
    isSelf,
    targetIsLeader,
  };
}

async function loadMember(pool, id) {
  const r = await pool.query(
    `SELECT ${memberShape},(auth_subject IS NOT NULL) AS has_login FROM profiles p WHERE p.id=$1`,
    [id],
  );
  return r.rows[0] || null;
}

async function listMembers(pool, { includeInactive = true } = {}) {
  const where = includeInactive ? "" : "WHERE p.is_active=true";
  const r = await pool.query(`SELECT ${memberShape},
      (auth_subject IS NOT NULL) AS has_login,
      (SELECT count(DISTINCT ta.task_id) FROM task_assignees ta JOIN tasks t ON t.id=ta.task_id WHERE ta.user_id=p.id AND t.archived_at IS NULL)::int AS active_task_count,
      (SELECT CASE WHEN count(DISTINCT ta.task_id)=0 THEN NULL ELSE round((count(DISTINCT ta.task_id) FILTER (WHERE t.status='done')::numeric / count(DISTINCT ta.task_id))*100,2) END FROM task_assignees ta JOIN tasks t ON t.id=ta.task_id WHERE ta.user_id=p.id AND t.archived_at IS NULL) AS progress,
      (SELECT count(*) FROM project_members pm WHERE pm.user_id=p.id)::int AS project_count
    FROM profiles p ${where} ORDER BY (p.role='leader') DESC,(p.role='admin') DESC,p.is_active DESC,p.display_name`);
  return r.rows;
}

async function createMember(pool, actor, b) {
  if (!isManager(actor))
    fail("Adding members requires manager privileges.", 403, "FORBIDDEN");
  const role = b.role ?? "member";
  if (!["member", "admin"].includes(role)) fail("role is invalid.");
  if (role === "admin" && !isLeader(actor))
    fail("Only a leader can add an admin.", 403, "FORBIDDEN");
  const displayName = text(
    b.displayName ?? b.display_name ?? b.name,
    "displayName",
    120,
  );
  const email = text(b.email, "email", 254).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("email is invalid.");
  const password = typeof b.password === "string" ? b.password : "";
  if (password.length < 8) fail("Password must be at least 8 characters.");
  if (b.passwordConfirm !== undefined && b.passwordConfirm !== password)
    fail("Password confirmation does not match.");
  const jobTitle =
    typeof b.jobTitle === "string"
      ? b.jobTitle.trim() || null
      : typeof b.job_title === "string"
        ? b.job_title.trim() || null
        : null;
  // A whole account (profile + Better Auth user + credential + audit row) is written in ONE
  // transaction so a partially created account can never remain if any step fails.
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const dup = await c.query(
      'SELECT 1 FROM "user" WHERE lower(email)=lower($1)',
      [email],
    );
    if (dup.rowCount)
      fail("Email is already used by another account.", 409, "EMAIL_TAKEN");
    const profileId = randomUUID();
    await c.query(
      "INSERT INTO profiles (id,display_name,role,job_title,is_active) VALUES($1,$2,$3,$4,true)",
      [profileId, displayName, role, jobTitle],
    );
    await provisionInTransaction({
      client: c,
      email,
      name: displayName,
      role,
      profileId,
      password,
      jobTitle,
    });
    await accountLog(c, actor, "member.created", { profileId, role, email });
    await c.query("COMMIT");
    return await loadMember(pool, profileId);
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}

async function updateMember(pool, actor, targetId, b) {
  const target = await loadMember(pool, targetId);
  if (!target) fail("Member not found.", 404, "NOT_FOUND");
  const perms = memberPermissions(actor, target);
  if (!perms.edit && !perms.changeRole)
    fail("You cannot manage this account.", 403, "FORBIDDEN");
  const sets = [],
    vals = [];
  if ("displayName" in b || "display_name" in b) {
    if (!perms.edit) fail("Profile edit not permitted.", 403, "FORBIDDEN");
    sets.push(`display_name=$${vals.length + 1}`);
    vals.push(text(b.displayName ?? b.display_name, "displayName", 120));
  }
  if ("jobTitle" in b || "job_title" in b) {
    if (!perms.edit) fail("Profile edit not permitted.", 403, "FORBIDDEN");
    const v = b.jobTitle ?? b.job_title;
    sets.push(`job_title=$${vals.length + 1}`);
    vals.push(typeof v === "string" ? v.trim() || null : null);
  }
  let roleChanged = false;
  if ("role" in b && b.role !== target.role) {
    assertRoleChangeAllowed(actor, target, b.role);
    sets.push(`role=$${vals.length + 1}`);
    vals.push(b.role);
    roleChanged = true;
  }
  // Email is intentionally not editable here: it is owned by Better Auth and needs a re-verification flow.
  if ("email" in b && String(b.email).toLowerCase() !== "")
    fail("Email cannot be changed from this endpoint.", 400, "EMAIL_IMMUTABLE");
  if (!sets.length) return { member: target, roleChanged: false };
  vals.push(targetId);
  await pool.query(
    `UPDATE profiles SET ${sets.join(",")},updated_at=now() WHERE id=$${vals.length}`,
    vals,
  );
  const member = await loadMember(pool, targetId);
  const metadata = {
    profileId: targetId,
    fields: sets.map((s) => s.split("=")[0]),
  };
  if (roleChanged) metadata.role = { from: target.role, to: b.role };
  await accountLog(
    pool,
    actor,
    roleChanged ? "member.role_changed" : "member.updated",
    metadata,
  );
  // A role change invalidates existing sessions so the next request re-reads the new capabilities.
  if (roleChanged) await revokeSessions(pool, targetId);
  return { member, roleChanged };
}

async function setActive(pool, actor, targetId, active) {
  const target = await loadMember(pool, targetId);
  if (!target) fail("Member not found.", 404, "NOT_FOUND");
  const perms = memberPermissions(actor, target);
  if (active ? !perms.activate : !perms.deactivate)
    fail("You cannot change this account status.", 403, "FORBIDDEN");
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "UPDATE profiles SET is_active=$1,deactivated_at=CASE WHEN $1 THEN NULL ELSE now() END,deactivated_by=CASE WHEN $1 THEN NULL ELSE $2::uuid END,updated_at=now() WHERE id=$3",
      [active, actor.id, targetId],
    );
    if (!active) await revokeSessions(c, targetId);
    await accountLog(
      c,
      actor,
      active ? "member.activated" : "member.deactivated",
      { profileId: targetId },
    );
    await c.query("COMMIT");
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
  return loadMember(pool, targetId);
}

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const url = new URL(req.url, "http://localhost");
    const parts = url.pathname
      .replace(/^\/api\/?/, "")
      .split("/")
      .filter(Boolean);
    const resource = parts[0],
      target = parts[1],
      nested = parts[2],
      nestedId = parts[3],
      b = body(req),
      pool = getPool();

    if (resource === "auth" && target === "me") {
      return json(res, 200, {
        user: {
          id: user.id,
          displayName: user.display_name,
          jobTitle: user.job_title || null,
          role: user.role,
        },
        capabilities: capabilities(user),
      });
    }

    if (resource === "members") {
      if (req.method === "GET" && !target) {
        const includeInactive = url.searchParams.get("status") !== "active";
        const members = (await listMembers(pool, { includeInactive })).map(
          (member) => ({
            ...member,
            permissions: memberPermissions(user, member),
          }),
        );
        return json(res, 200, { members, capabilities: capabilities(user) });
      }
      if (req.method === "GET" && target) {
        const id = uuid(target, "memberId");
        const member = await loadMember(pool, id);
        if (!member)
          return json(res, 404, {
            code: "NOT_FOUND",
            message: "Member not found.",
          });
        if (!isManager(user) && user.id !== id)
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Member detail is restricted.",
          });
        return json(res, 200, {
          member: { ...member, permissions: memberPermissions(user, member) },
        });
      }
      if (req.method === "POST" && !target) {
        const member = await createMember(pool, user, b);
        return json(res, 201, {
          member: { ...member, permissions: memberPermissions(user, member) },
        });
      }
      if (req.method === "PATCH" && target && !nested) {
        const id = uuid(target, "memberId");
        const result = await updateMember(pool, user, id, b);
        return json(res, 200, {
          member: {
            ...result.member,
            permissions: memberPermissions(user, result.member),
          },
          roleChanged: result.roleChanged,
        });
      }
      if (
        req.method === "POST" &&
        target &&
        (nested === "deactivate" || nested === "activate")
      ) {
        const id = uuid(target, "memberId");
        const member = await setActive(pool, user, id, nested === "activate");
        return json(res, 200, {
          member: { ...member, permissions: memberPermissions(user, member) },
        });
      }
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "Endpoint not found.",
      });
    }

    if (resource === "projects") {
      if (req.method === "GET" && !target) {
        const r = await pool.query(
          `SELECT p.*,p.category,p.created_by=$1 AS is_owner,(SELECT count(*) FROM project_members pm WHERE pm.project_id=p.id)::int AS member_count FROM projects p LEFT JOIN project_members m ON m.project_id=p.id AND m.user_id=$1 WHERE p.archived_at IS NULL AND (p.created_by=$1 OR m.user_id IS NOT NULL OR $2=true) ORDER BY p.updated_at DESC`,
          [user.id, isManager(user)],
        );
        return json(res, 200, { projects: r.rows });
      }
      if (req.method === "GET" && target && nested === "members") {
        const projectId = uuid(target, "projectId");
        if (!(await canReadProject(user, projectId)))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Project access denied.",
          });
        const r = await pool.query(
          `SELECT p.id,p.display_name,p.job_title,p.role,p.is_active,pm.project_role,pm.joined_at FROM project_members pm JOIN profiles p ON p.id=pm.user_id WHERE pm.project_id=$1 AND p.is_active=true ORDER BY pm.project_role DESC,p.display_name`,
          [projectId],
        );
        return json(res, 200, { members: r.rows });
      }
      if (req.method === "GET" && target && !nested) {
        const projectId = uuid(target, "projectId");
        if (!(await canReadProject(user, projectId)))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Project access denied.",
          });
        const r = await pool.query(
          "SELECT p.*,(SELECT count(*) FROM project_members pm WHERE pm.project_id=p.id)::int AS member_count FROM projects p WHERE p.id=$1 AND p.archived_at IS NULL",
          [projectId],
        );
        if (!r.rowCount)
          return json(res, 404, {
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        const members = (
          await pool.query(
            `SELECT p.id,p.display_name,p.job_title,p.role,pm.project_role FROM project_members pm JOIN profiles p ON p.id=pm.user_id WHERE pm.project_id=$1 AND p.is_active=true ORDER BY p.display_name`,
            [projectId],
          )
        ).rows;
        return json(res, 200, { project: r.rows[0], members });
      }
      if (req.method === "PUT" && target && nested === "members") {
        if (!isManager(user))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Manager role required.",
          });
        const projectId = uuid(target, "projectId"),
          memberIds = b.memberIds;
        if (
          !Array.isArray(memberIds) ||
          new Set(memberIds).size !== memberIds.length ||
          memberIds.some((id) => !UUID.test(String(id)))
        )
          return json(res, 400, {
            code: "VALIDATION_ERROR",
            message: "memberIds is invalid.",
          });
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const own = await c.query(
            "SELECT 1 FROM projects WHERE id=$1 AND archived_at IS NULL",
            [projectId],
          );
          if (!own.rowCount) fail("Project not found.", 404, "NOT_FOUND");
          const valid = await c.query(
            "SELECT id FROM profiles WHERE id=ANY($1::uuid[]) AND is_active=true AND role <> 'leader'",
            [memberIds],
          );
          if (valid.rowCount !== memberIds.length)
            fail("Selected members must be active non-leader accounts.");
          await c.query(
            "DELETE FROM project_members WHERE project_id=$1 AND project_role='member'",
            [projectId],
          );
          if (memberIds.length)
            await c.query(
              "INSERT INTO project_members(project_id,user_id,project_role) SELECT $1,id,'member' FROM profiles WHERE id=ANY($2::uuid[])",
              [projectId, memberIds],
            );
          await log(c, user, projectId, null, "project.members_updated", {
            memberIds,
          });
          await c.query("COMMIT");
          return json(res, 200, { memberIds });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (
        (req.method === "POST" && !target) ||
        (req.method === "PATCH" && target && !nested)
      ) {
        if (!isManager(user))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Manager role required.",
          });
        const editing = req.method === "PATCH";
        const projectId = editing ? uuid(target, "projectId") : null;
        const name = text(b.name, "name", 300);
        if (
          b.category !== undefined &&
          b.category !== null &&
          !categories.includes(b.category)
        )
          fail("category is invalid.");
        const memberIds = b.memberIds ?? [];
        if (
          !Array.isArray(memberIds) ||
          new Set(memberIds).size !== memberIds.length ||
          memberIds.some((id) => !UUID.test(String(id)))
        )
          fail("memberIds is invalid.");
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          if (memberIds.length) {
            const valid = await c.query(
              "SELECT id FROM profiles WHERE id=ANY($1::uuid[]) AND is_active=true AND role <> 'leader'",
              [memberIds],
            );
            if (valid.rowCount !== memberIds.length)
              fail("Selected members must be active non-leader accounts.");
          }
          let project;
          if (editing) {
            const existing = await c.query(
              "SELECT created_by FROM projects WHERE id=$1 AND archived_at IS NULL FOR UPDATE",
              [projectId],
            );
            if (!existing.rowCount)
              fail("Project not found.", 404, "NOT_FOUND");
            if (!isLeader(user) && existing.rows[0].created_by !== user.id)
              fail("You can only edit projects you own.", 403, "FORBIDDEN");
            const r = await c.query(
              "UPDATE projects SET name=$1,description=$2,category=$3,updated_at=now() WHERE id=$4 RETURNING *",
              [
                name,
                typeof b.description === "string"
                  ? b.description.trim() || null
                  : null,
                b.category || null,
                projectId,
              ],
            );
            project = r.rows[0];
            await c.query(
              "DELETE FROM project_members WHERE project_id=$1 AND project_role='member'",
              [projectId],
            );
            if (memberIds.length)
              await c.query(
                "INSERT INTO project_members(project_id,user_id,project_role) SELECT $1,id,'member' FROM profiles WHERE id=ANY($2::uuid[])",
                [projectId, memberIds],
              );
            await log(c, user, projectId, null, "project.updated", {
              memberIds,
            });
          } else {
            const r = await c.query(
              "INSERT INTO projects(name,description,category,created_by) VALUES($1,$2,$3,$4) RETURNING *",
              [
                name,
                typeof b.description === "string"
                  ? b.description.trim() || null
                  : null,
                b.category || null,
                user.id,
              ],
            );
            project = r.rows[0];
            await log(c, user, project.id, null, "project.created", {
              memberIds,
            });
            await c.query(
              "INSERT INTO project_members(project_id,user_id,project_role) VALUES($1,$2,$3)",
              [project.id, user.id, "lead"],
            );
            if (memberIds.length)
              await c.query(
                "INSERT INTO project_members(project_id,user_id,project_role) SELECT $1,id,'member' FROM profiles WHERE id=ANY($2::uuid[])",
                [project.id, memberIds],
              );
          }
          await c.query("COMMIT");
          return json(res, editing ? 200 : 201, { project });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "Endpoint not found.",
      });
    }

    if (resource === "activity") {
      if (req.method !== "GET")
        return json(res, 405, {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed.",
        });
      const r = await pool.query(
        `SELECT a.*,p.display_name AS actor_name FROM activity_logs a JOIN profiles p ON p.id=a.actor_id LEFT JOIN project_members pm ON pm.project_id=a.project_id AND pm.user_id=$1 WHERE a.project_id IS NULL OR pm.user_id IS NOT NULL OR EXISTS (SELECT 1 FROM projects x WHERE x.id=a.project_id AND x.created_by=$1) ORDER BY a.created_at DESC LIMIT 100`,
        [user.id],
      );
      return json(res, 200, { activity: r.rows });
    }

    if (resource === "progress" && (!target || target === "team")) {
      if (req.method !== "GET")
        return json(res, 405, {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed.",
        });
      const r = await pool.query(
        `SELECT t.id,t.title,t.status,t.weight,t.project_id,COALESCE(ci.total,0)::int AS checklist_count,COALESCE(ci.completed,0)::int AS completed_checklist,CASE WHEN COALESCE(ci.total,0)=0 THEN NULL ELSE ROUND((ci.completed::numeric/ci.total)*100,2) END AS completion_percent,CASE WHEN COALESCE(ci.total,0)=0 THEN 'NO_ACTIVE_CHECKLIST' ELSE NULL END AS progress_unavailable_reason FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN project_members pm ON pm.project_id=t.project_id AND pm.user_id=$1 LEFT JOIN (SELECT task_id,count(*) total,count(*) FILTER (WHERE is_completed) completed FROM checklist_items WHERE archived_at IS NULL GROUP BY task_id) ci ON ci.task_id=t.id WHERE t.archived_at IS NULL AND (p.created_by=$1 OR pm.user_id IS NOT NULL OR $2=true) GROUP BY t.id,p.created_by,ci.total,ci.completed`,
        [user.id, isManager(user)],
      );
      return json(res, 200, { progress: r.rows });
    }

    if (resource !== "tasks")
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "Endpoint not found.",
      });

    if (target) {
      const taskId = uuid(target, "taskId"),
        projectId = await taskProject(pool, taskId);
      if (!projectId || !(await canReadTask(user, taskId)))
        return json(res, 403, {
          code: "FORBIDDEN",
          message: "Task access denied.",
        });

      if (nested === "comments" && req.method === "GET") {
        const r = await pool.query(
          `SELECT c.*,p.display_name AS author_name FROM task_comments c JOIN profiles p ON p.id=c.user_id WHERE c.task_id=$1 ORDER BY c.created_at ASC`,
          [taskId],
        );
        return json(res, 200, { comments: r.rows });
      }
      if (nested === "comments" && req.method === "POST") {
        const value = text(b.body, "body");
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const r = await c.query(
            "INSERT INTO task_comments(task_id,user_id,body) VALUES($1,$2,$3) RETURNING *",
            [taskId, user.id, value],
          );
          await log(c, user, projectId, taskId, "comment.created");
          await c.query("COMMIT");
          return json(res, 201, { comment: r.rows[0] });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (nested === "updates" && req.method === "GET") {
        const r = await pool.query(
          `SELECT u.*,p.display_name AS author_name FROM task_updates u JOIN profiles p ON p.id=u.user_id WHERE u.task_id=$1 ORDER BY u.created_at DESC`,
          [taskId],
        );
        return json(res, 200, { updates: r.rows });
      }
      if (nested === "updates" && req.method === "POST") {
        const summary = text(b.workSummary ?? b.work_summary, "workSummary");
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const r = await c.query(
            "INSERT INTO task_updates(task_id,user_id,work_summary,blockers) VALUES($1,$2,$3,$4) RETURNING *",
            [
              taskId,
              user.id,
              summary,
              typeof b.blockers === "string" ? b.blockers.trim() || null : null,
            ],
          );
          await log(c, user, projectId, taskId, "update.created");
          await c.query("COMMIT");
          return json(res, 201, { update: r.rows[0] });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (
        nested === "assignees" &&
        (req.method === "PUT" || req.method === "PATCH")
      ) {
        if (!isManager(user))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Manager role required.",
          });
        const ids = b.userIds ?? b.assigneeIds;
        if (
          !Array.isArray(ids) ||
          new Set(ids).size !== ids.length ||
          ids.some((id) => !UUID.test(String(id)))
        )
          return json(res, 400, {
            code: "VALIDATION_ERROR",
            message: "userIds is invalid.",
          });
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const valid = await c.query(
            "SELECT pm.user_id FROM project_members pm JOIN profiles p ON p.id=pm.user_id WHERE pm.project_id=$1 AND pm.user_id=ANY($2::uuid[]) AND p.is_active=true",
            [projectId, ids],
          );
          if (valid.rowCount !== ids.length)
            fail("Assignees must be active project members.");
          await c.query("DELETE FROM task_assignees WHERE task_id=$1", [
            taskId,
          ]);
          if (ids.length)
            await c.query(
              "INSERT INTO task_assignees(task_id,user_id) SELECT $1,id FROM profiles WHERE id=ANY($2::uuid[]) AND is_active=true",
              [taskId, ids],
            );
          await c.query(
            "UPDATE checklist_items SET assignee_id=NULL,updated_at=now() WHERE task_id=$1 AND archived_at IS NULL AND assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT user_id FROM task_assignees WHERE task_id=$1)",
            [taskId],
          );
          await log(c, user, projectId, taskId, "task.assignees_updated", {
            userIds: ids,
          });
          await c.query("COMMIT");
          return json(res, 200, { assigneeIds: ids });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (
        (nested === "checklist" || nested === "checklists") &&
        nestedId &&
        req.method === "PATCH"
      ) {
        if (!(await canUpdateChecklist(user, taskId)))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Checklist access denied.",
          });
        const itemId = uuid(nestedId, "itemId");
        const existing = await pool.query(
          "SELECT assignee_id,is_completed,title,description,sort_order FROM checklist_items WHERE id=$1 AND task_id=$2 AND archived_at IS NULL",
          [itemId, taskId],
        );
        if (!existing.rowCount)
          return json(res, 404, {
            code: "NOT_FOUND",
            message: "Checklist item not found.",
          });
        // Members may toggle completion only on items assigned to them; managers may edit any item and its fields.
        const manager = isManager(user);
        if (!manager && existing.rows[0].assignee_id !== user.id)
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Checklist assignment required.",
          });
        const completed = b.completed === true;
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          let r;
          if (
            manager &&
            ("title" in b ||
              "description" in b ||
              "assigneeId" in b ||
              "sortOrder" in b ||
              "completed" in b)
          ) {
            const title =
              "title" in b
                ? text(b.title, "title", 500)
                : existing.rows[0].title;
            const description =
              "description" in b
                ? typeof b.description === "string"
                  ? b.description.trim() || null
                  : null
                : existing.rows[0].description;
            const assignee =
              "assigneeId" in b
                ? b.assigneeId || null
                : existing.rows[0].assignee_id;
            const sortOrder =
              "sortOrder" in b && Number.isInteger(b.sortOrder)
                ? b.sortOrder
                : existing.rows[0].sort_order;
            if (assignee)
              await assertChecklistAssignee(c, taskId, projectId, assignee);
            r = await c.query(
              "UPDATE checklist_items SET title=$1,description=$2,assignee_id=$3,sort_order=$4,is_completed=$5,completed_by=CASE WHEN $5 THEN $6::uuid ELSE NULL END,completed_at=CASE WHEN $5 THEN now() ELSE NULL END,updated_at=now() WHERE id=$7 AND task_id=$8 AND archived_at IS NULL RETURNING *",
              [
                title,
                description,
                assignee,
                sortOrder,
                completed,
                user.id,
                itemId,
                taskId,
              ],
            );
            await log(c, user, projectId, taskId, "checklist.updated", {
              itemId,
              fields: Object.keys(b),
            });
          } else {
            r = await c.query(
              "UPDATE checklist_items SET is_completed=$1,completed_by=CASE WHEN $1 THEN $2::uuid ELSE NULL END,completed_at=CASE WHEN $1 THEN now() ELSE NULL END,updated_at=now() WHERE id=$3 AND task_id=$4 AND archived_at IS NULL RETURNING *",
              [completed, user.id, itemId, taskId],
            );
            await log(
              c,
              user,
              projectId,
              taskId,
              completed ? "checklist.completed" : "checklist.uncompleted",
              { itemId },
            );
          }
          await c.query("COMMIT");
          return json(res, 200, { item: r.rows[0] });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (nested === "checklists" && req.method === "POST") {
        if (!isManager(user))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Manager role required.",
          });
        const items = Array.isArray(b.items)
          ? b.items
          : Array.isArray(b.checklists)
            ? b.checklists
            : [];
        if (!items.length)
          return json(res, 400, {
            code: "VALIDATION_ERROR",
            message: "items is required.",
          });
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const out = [];
          for (const item of items) {
            const assignee = item.assigneeId ?? item.assignee_id ?? null;
            if (assignee) {
              uuid(assignee, "assigneeId");
              await assertChecklistAssignee(c, taskId, projectId, assignee);
            }
            const r = await c.query(
              "INSERT INTO checklist_items(task_id,title,description,assignee_id,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
              [
                taskId,
                text(item.title, "title", 500),
                typeof item.description === "string"
                  ? item.description.trim() || null
                  : null,
                assignee,
                Number.isInteger(item.sortOrder) ? item.sortOrder : out.length,
                user.id,
              ],
            );
            out.push(r.rows[0]);
          }
          await log(c, user, projectId, taskId, "checklist.created", {
            count: out.length,
          });
          await c.query("COMMIT");
          return json(res, 201, { items: out });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (
        (nested === "checklist" || nested === "checklists") &&
        req.method === "GET"
      ) {
        const r = await pool.query(
          "SELECT * FROM checklist_items WHERE task_id=$1 AND archived_at IS NULL ORDER BY sort_order,id",
          [taskId],
        );
        return json(res, 200, { items: r.rows });
      }
      if (req.method === "POST" && nested === "archive") {
        if (!isManager(user))
          return json(res, 403, {
            code: "FORBIDDEN",
            message: "Manager role required.",
          });
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const r = await c.query(
            "UPDATE tasks SET status='archived',archived_at=now(),updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING *",
            [taskId],
          );
          if (!r.rowCount) {
            await c.query("ROLLBACK");
            return json(res, 404, {
              code: "NOT_FOUND",
              message: "Task not found.",
            });
          }
          await log(c, user, projectId, taskId, "task.archived");
          await c.query("COMMIT");
          return json(res, 200, { task: r.rows[0] });
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (req.method === "GET") {
        const r = await pool.query(
          `${TASK_SELECT} WHERE t.id=$1 GROUP BY t.id,pr.name`,
          [taskId],
        );
        if (!r.rowCount)
          return json(res, 404, {
            code: "NOT_FOUND",
            message: "Task not found.",
          });
        const task = r.rows[0];
        return json(res, 200, {
          task: { ...task, progress: task.completion_percent },
        });
      }
      if (!isManager(user))
        return json(res, 403, {
          code: "FORBIDDEN",
          message: "Manager role required.",
        });
      validateTaskFields(b, true);
      const fields = [],
        vals = [];
      for (const k of ["title", "description", "status", "priority", "weight"])
        if (k in b) {
          fields.push(`${k}=$${vals.length + 1}`);
          vals.push(
            k === "title"
              ? text(b[k], "title", 300)
              : k === "weight"
                ? Number(b[k])
                : b[k],
          );
        }
      if ("dueAt" in b) {
        fields.push(`due_at=$${vals.length + 1}`);
        vals.push(dueDate(b.dueAt));
      }
      if ("projectId" in b && b.projectId !== projectId)
        fail("A task cannot be moved to another project.");
      const assigneeIds = b.assigneeIds ?? b.userIds;
      if (
        assigneeIds !== undefined &&
        (!Array.isArray(assigneeIds) ||
          new Set(assigneeIds).size !== assigneeIds.length ||
          assigneeIds.some((id) => !UUID.test(String(id))))
      )
        return json(res, 400, {
          code: "VALIDATION_ERROR",
          message: "assigneeIds is invalid.",
        });
      const checklist = b.checklist ?? b.checklists;
      if (checklist !== undefined && !Array.isArray(checklist))
        return json(res, 400, {
          code: "VALIDATION_ERROR",
          message: "checklist is invalid.",
        });
      if (
        !fields.length &&
        assigneeIds === undefined &&
        checklist === undefined
      )
        return json(res, 400, {
          code: "VALIDATION_ERROR",
          message: "No changes.",
        });
      vals.push(taskId);
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const current = await c.query(
          "SELECT project_id,status,archived_at FROM tasks WHERE id=$1 FOR UPDATE",
          [taskId],
        );
        if (!current.rowCount || current.rows[0].archived_at)
          fail("Task not found.", 404, "NOT_FOUND");
        if (current.rows[0].project_id !== projectId)
          fail("Task project mismatch.");
        const project = await c.query(
          "SELECT 1 FROM projects WHERE id=$1 AND status='active' AND archived_at IS NULL",
          [projectId],
        );
        if (!project.rowCount) fail("Project is not active.");
        if (assigneeIds !== undefined && assigneeIds.length) {
          const valid = await c.query(
            "SELECT pm.user_id FROM project_members pm JOIN profiles p ON p.id=pm.user_id WHERE pm.project_id=$1 AND pm.user_id=ANY($2::uuid[]) AND p.is_active=true",
            [projectId, assigneeIds],
          );
          if (valid.rowCount !== new Set(assigneeIds).size)
            fail("Assignees must be active project members.");
        }
        if (fields.length)
          await c.query(
            `UPDATE tasks SET ${fields.join(",")},updated_at=now(),archived_at=CASE WHEN status='archived' THEN now() ELSE archived_at END WHERE id=$${vals.length}`,
            vals,
          );
        // Validate the two assignments explicit before mutating checklist owners.
        if (assigneeIds !== undefined && checklist !== undefined) {
          const finalAssignees = new Set(assigneeIds);
          for (const item of checklist) {
            const assignee = item.assigneeId ?? item.assignee_id ?? null;
            if (assignee && !finalAssignees.has(assignee))
              fail(
                "Checklist owner must be one of the selected task assignees.",
              );
          }
        }
        if (assigneeIds !== undefined) {
          await c.query("DELETE FROM task_assignees WHERE task_id=$1", [
            taskId,
          ]);
          if (assigneeIds.length)
            await c.query(
              "INSERT INTO task_assignees(task_id,user_id) SELECT $1,id FROM profiles WHERE id=ANY($2::uuid[]) AND is_active=true",
              [taskId, assigneeIds],
            );
          // When the checklist is not sent, detach checklist owners no longer assigned. When it is sent,
          // syncChecklist re-validates owners so an invalid owner is rejected instead of silently dropped.
          if (checklist === undefined)
            await c.query(
              "UPDATE checklist_items SET assignee_id=NULL,updated_at=now() WHERE task_id=$1 AND archived_at IS NULL AND assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT user_id FROM task_assignees WHERE task_id=$1)",
              [taskId],
            );
        }
        let checklistChange;
        if (checklist !== undefined)
          checklistChange = await syncChecklist(
            c,
            taskId,
            projectId,
            checklist,
            user.id,
          );
        if (fields.length && !assigneeIds && checklist === undefined) {
          await c.query(
            "UPDATE checklist_items SET assignee_id=NULL,updated_at=now() WHERE task_id=$1 AND archived_at IS NULL AND assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT user_id FROM task_assignees WHERE task_id=$1)",
            [taskId],
          );
        }
        await log(c, user, projectId, taskId, "task.updated", {
          fields: fields.map((x) => x.split("=")[0]),
          assigneeIds,
          checklist: checklistChange
            ? {
                updated: checklistChange.kept.length,
                archived: checklistChange.removed.length,
              }
            : undefined,
        });
        const updated = await c.query(
          `${TASK_SELECT} WHERE t.id=$1 GROUP BY t.id,pr.name`,
          [taskId],
        );
        await c.query("COMMIT");
        const task = updated.rows[0];
        return json(res, 200, {
          task: { ...task, progress: task.completion_percent },
        });
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    }

    if (req.method === "GET") {
      const r = await pool.query(
        `SELECT t.*,p.name AS project_name,${CHECKLIST_PROGRESS},COALESCE((SELECT json_agg(jsonb_build_object('id',ap.id,'name',ap.display_name,'role',ap.role) ORDER BY ap.display_name) FROM task_assignees ta JOIN profiles ap ON ap.id=ta.user_id WHERE ta.task_id=t.id),'[]') assignees FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN project_members pm ON pm.project_id=t.project_id AND pm.user_id=$1 LEFT JOIN task_assignees at ON at.task_id=t.id AND at.user_id=$1 WHERE t.archived_at IS NULL AND (p.created_by=$1 OR pm.user_id IS NOT NULL OR at.user_id IS NOT NULL OR $2=true) ORDER BY t.created_at DESC`,
        [user.id, isManager(user)],
      );
      return json(res, 200, { tasks: r.rows });
    }
    if (req.method === "POST") {
      if (!isManager(user))
        return json(res, 403, {
          code: "FORBIDDEN",
          message: "Manager role required.",
        });
      const projectId = uuid(b.projectId, "projectId");
      validateTaskFields(b);
      const assignees = b.assigneeIds ?? b.userIds ?? [];
      if (
        !Array.isArray(assignees) ||
        new Set(assignees).size !== assignees.length ||
        assignees.some((id) => !UUID.test(String(id)))
      )
        fail("assigneeIds is invalid.");
      const items = Array.isArray(b.checklist)
        ? b.checklist
        : Array.isArray(b.checklists)
          ? b.checklists
          : [];
      for (const item of items) {
        const assignee = item.assigneeId ?? item.assignee_id ?? null;
        if (assignee && !assignees.includes(assignee))
          fail("Checklist owner must be one of the selected task assignees.");
      }
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const p = await c.query(
          "SELECT 1 FROM projects WHERE id=$1 AND status='active' AND archived_at IS NULL",
          [projectId],
        );
        if (!p.rowCount) fail("Project is not active.");
        if (assignees.length) {
          const a = await c.query(
            "SELECT id FROM profiles WHERE id=ANY($1::uuid[]) AND is_active=true",
            [assignees],
          );
          const m = await c.query(
            "SELECT user_id FROM project_members WHERE project_id=$1 AND user_id=ANY($2::uuid[])",
            [projectId, assignees],
          );
          if (
            a.rowCount !== assignees.length ||
            m.rowCount !== assignees.length
          )
            fail("Assignees must be active project members.");
        }
        const r = await c.query(
          "INSERT INTO tasks(project_id,title,description,status,priority,due_at,weight,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [
            projectId,
            text(b.title, "title", 300),
            b.description || null,
            b.status || "todo",
            b.priority || "medium",
            dueDate(b.dueAt ?? null),
            b.weight === undefined ? 1 : Number(b.weight),
            user.id,
          ],
        );
        const taskId = r.rows[0].id;
        if (assignees.length)
          await c.query(
            "INSERT INTO task_assignees(task_id,user_id) SELECT $1,unnest($2::uuid[])",
            [taskId, assignees],
          );
        for (let i = 0; i < items.length; i++) {
          const item = items[i],
            assignee = item.assigneeId ?? item.assignee_id ?? null;
          if (assignee) {
            uuid(assignee, "assigneeId");
            if (!assignees.includes(assignee))
              fail("Checklist assignee must be a task assignee.");
          }
          await c.query(
            "INSERT INTO checklist_items(task_id,title,description,assignee_id,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6)",
            [
              taskId,
              text(item.title, "title", 500),
              typeof item.description === "string"
                ? item.description.trim() || null
                : null,
              assignee,
              Number.isInteger(item.sortOrder) ? item.sortOrder : i,
              user.id,
            ],
          );
        }
        await log(c, user, projectId, taskId, "task.created");
        const created = await c.query(
          `${TASK_SELECT} WHERE t.id=$1 GROUP BY t.id,pr.name`,
          [taskId],
        );
        await c.query("COMMIT");
        const task = created.rows[0];
        return json(res, 201, {
          task: { ...task, progress: task.completion_percent },
        });
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    }
    return json(res, 405, {
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed.",
    });
  } catch (e) {
    const status = e.status || 500;
    return json(res, status, {
      code: e.code || (e.status ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
      message: e.status ? e.message : "Request failed.",
    });
  }
}
