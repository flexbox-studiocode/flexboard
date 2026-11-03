# FlexBoard API contracts

All domain responses use `{ data: ... }`; errors use `{ error: { code, message } }`. `requestTaskApi()` unwraps `data` before returning it.

## `GET /api/tasks`

Optional query parameters: `q`, `project`, `member`, `status`, `priority`, `from`, `to`. Dates use `YYYY-MM-DD`. Archived tasks are excluded.

```json
{ "data": { "tasks": [{
  "id": "uuid", "project_id": "uuid", "project_name": "string",
  "title": "string", "description": "string|null", "status": "todo|in_progress|in_review|done",
  "priority": "low|medium|high", "due_at": "YYYY-MM-DD|null",
  "assignees": [{ "id": "uuid", "name": "string", "role": "member" }],
  "checklist_count": 5, "completed_checklist": 2, "completion_percent": "40.00|null"
}] } }
```

## `GET /api/members`

Returns active and inactive profiles according to the existing endpoint policy. Progress is always checklist-based:

```json
{ "data": { "members": [{
  "id": "uuid", "display_name": "Bima", "role": "member", "is_active": true,
  "active_task_count": 1, "checklist_count": 5, "completed_checklist": 2,
  "completion_percent": "40.00|null",
  "progress_status": "IN_PROGRESS|NOT_STARTED|COMPLETE|NO_ASSIGNED_CHECKLIST"
}] } }
```

## `GET /api/progress/team`

Returns one row per active member, never one row per task. The same checklist formula is used by `/members`.

## `GET /api/activity`

Returns actor, project, task, action, safe metadata, and timestamp. Leader access is workspace-wide; non-leaders are limited to activities on accessible projects/tasks and account-level activity.

## Authorization

- Project create, update, and project-member management: `leader` only; non-leaders receive HTTP 403.
- Task create/update/assignment/archive: existing manager policy (`leader` or `admin`).
- Checklist completion: member must own the checklist item; managers may manage items in scope.
- All domain endpoints require an authenticated active Better Auth session.
