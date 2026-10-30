/**
 * Pure data adapters that translate backend response shapes into the
 * presentation props used by TaskCard / MemberCard / ActivityList.
 * No fallback/mock values are fabricated: missing server data stays
 * unavailable so the UI fails closed instead of inventing facts.
 */

const truthyLabel = value => (typeof value === 'string' && value.trim() ? value.trim() : null)
const dateOnlyLabel = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}
const numberOrNull = value => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function assigneeRoleLabel(member) {
  const jobTitle = truthyLabel(member.job_title)
  const role = member.role === 'leader' ? 'Leader' : member.role === 'member' ? 'Member' : null
  if (jobTitle && role) return `${jobTitle} — ${role}`
  return jobTitle || role || null
}

/** API profile row → MemberCard props. */
export function toMemberCard(profile = {}) {
  return {
    id: profile.id,
    name: profile.display_name || profile.name || null,
    display_name: profile.display_name || profile.name || null,
    role: profile.role || null,
    job_title: profile.job_title || null,
    roleLabel: profile.roleLabel || assigneeRoleLabel(profile),
    statusLabel: profile.is_active === false ? 'Tidak aktif' : profile.is_active === true ? 'Aktif' : null,
    is_active: typeof profile.is_active === 'boolean' ? profile.is_active : undefined,
    activeTaskCount: numberOrNull(profile.active_task_count),
    progress: numberOrNull(profile.progress),
    permissions: profile.permissions || null,
  }
}

/** API task row (list) → TaskCard props. */
export function toTaskCard(task = {}) {
  const assignees = Array.isArray(task.assignees)
    ? task.assignees.map(person => ({ id: person.id, name: person.display_name || person.name, role: person.role }))
    : []
  return {
    id: task.id,
    title: task.title || null,
    description: task.description || null,
    detailPath: task.id ? `/tasks/${task.id}` : null,
    projectLabel: truthyLabel(task.project_name) || truthyLabel(task.project?.name),
    statusLabel: truthyLabel(task.status),
    priorityLabel: truthyLabel(task.priority),
    dueLabel: dateOnlyLabel(task.due_at || task.dueAt),
    assignees,
    progress: numberOrNull(task.completion_percent),
    progressLabel: 'Progres tugas',
  }
}

/** API progress row → MemberProgressList entry props. */
export function toProgressEntry(row = {}) {
  return {
    id: row.id,
    name: row.title || row.name || null,
    roleLabel: truthyLabel(row.role_label) || truthyLabel(row.role) || null,
    projectLabel: truthyLabel(row.project_name) || truthyLabel(row.project?.name),
    detailPath: row.id ? `/tasks/${row.id}` : null,
    progress: numberOrNull(row.completion_percent),
    averageProgress: numberOrNull(row.average_progress ?? row.completion_percent),
  }
}

/** API activity row → ActivityList entry props. */
export function toActivityEntry(row = {}) {
  return {
    id: row.id,
    actorLabel: truthyLabel(row.actor_name) || truthyLabel(row.actor?.name),
    actionLabel: truthyLabel(row.action),
    objectLabel: truthyLabel(row.object_label) || truthyLabel(row.task_title),
    objectPath: row.task_id ? `/tasks/${row.task_id}` : null,
    projectLabel: truthyLabel(row.project_name) || truthyLabel(row.project?.name),
    timeLabel: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : null,
    dateTime: row.created_at || null,
    description: truthyLabel(row.metadata?.summary) || truthyLabel(row.metadata?.description),
  }
}

/** API comment row → comment list item. */
export function toCommentItem(comment = {}) {
  return {
    id: comment.id,
    author: truthyLabel(comment.author_name) || truthyLabel(comment.author?.name) || 'Anggota tim',
    createdAt: comment.created_at || comment.createdAt || null,
    body: comment.body || comment.content || '',
  }
}

/** API update row → update list item. */
export function toUpdateItem(update = {}) {
  return {
    id: update.id,
    author: truthyLabel(update.author_name) || truthyLabel(update.author?.name) || 'Anggota tim',
    createdAt: update.created_at || update.createdAt || null,
    body: update.work_summary || update.workSummary || '',
    blockers: update.blockers || null,
  }
}

/** API checklist item → draft / presentation item. */
export function toChecklistItem(item = {}) {
  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    assigneeId: item.assignee_id || item.assigneeId || null,
    assigneeName: item.assignee_name || item.assigneeName || null,
    isCompleted: Boolean(item.is_completed ?? item.completed),
    completedBy: item.completed_by || null,
    completedAt: item.completed_at || null,
    sortOrder: Number.isInteger(item.sort_order ?? item.sortOrder) ? item.sort_order ?? item.sortOrder : 0,
    canEdit: item.canEdit === true,
  }
}
