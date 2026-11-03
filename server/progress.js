/**
 * Shared progress definition for every page.
 * Active assigned checklist items only; archived items, unassigned items and
 * checklist items owned by another member never enter an individual's totals.
 */
export const PROGRESS_STATUS = {
  COMPLETE: "COMPLETE",
  IN_PROGRESS: "IN_PROGRESS",
  NOT_STARTED: "NOT_STARTED",
  NO_ASSIGNED_CHECKLIST: "NO_ASSIGNED_CHECKLIST",
};

export function progressStatusFrom(count, completed) {
  const total = Number(count) || 0;
  const done = Number(completed) || 0;
  if (total === 0) return PROGRESS_STATUS.NO_ASSIGNED_CHECKLIST;
  if (done === 0) return PROGRESS_STATUS.NOT_STARTED;
  if (done >= total) return PROGRESS_STATUS.COMPLETE;
  return PROGRESS_STATUS.IN_PROGRESS;
}

/** SQL fragments use the supplied PostgreSQL placeholder for project scope. */
export function memberProgressSql(memberAlias = "p", projectPlaceholder = "NULL") {
  const scope = `ci.assignee_id = ${memberAlias}.id AND ci.archived_at IS NULL AND t.archived_at IS NULL AND t.status <> 'archived' AND (${projectPlaceholder}::uuid IS NULL OR t.project_id = ${projectPlaceholder}::uuid)`;
  const total = `SELECT count(*) FROM checklist_items ci JOIN tasks t ON t.id = ci.task_id WHERE ${scope}`;
  const completed = `SELECT count(*) FROM checklist_items ci JOIN tasks t ON t.id = ci.task_id WHERE ${scope} AND ci.is_completed = true`;
  return `
    (${total})::int AS checklist_count,
    (${completed})::int AS completed_checklist,
    CASE WHEN (${total}) = 0 THEN NULL ELSE ROUND(((${completed})::numeric / (${total})::numeric) * 100, 2) END AS completion_percent`;
}

export const memberActiveTasksSql = (memberAlias = "p") =>
  `(SELECT count(DISTINCT ta.task_id)::int FROM task_assignees ta JOIN tasks t ON t.id=ta.task_id WHERE ta.user_id=${memberAlias}.id AND t.archived_at IS NULL AND t.status <> 'archived') AS active_task_count`;
