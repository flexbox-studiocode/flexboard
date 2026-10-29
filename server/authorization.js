import { getAuthenticatedProfile } from './auth.js';
import { getPool } from './db/pool.js';

export async function requireUser(request, response) {
  const authenticated = await getAuthenticatedProfile(request);
  if (!authenticated) { response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }); return null; }
  return authenticated.profile;
}
export async function requireLeader(request, response) {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (user.role !== 'leader') { response.status(403).json({ error: { code: 'FORBIDDEN', message: 'Leader role required.' } }); return null; }
  return user;
}
export async function canReadProject(user, projectId) {
  const result = await getPool().query(`SELECT 1 FROM projects p
    JOIN profiles requester ON requester.id=$1 AND requester.is_active=true
    LEFT JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=$1
    WHERE p.id=$2 AND (p.created_by=$1 OR pm.user_id IS NOT NULL)`, [user.id, projectId]);
  return result.rowCount > 0;
}
export async function canReadTask(user, taskId) {
  const result = await getPool().query(`SELECT 1 FROM tasks t JOIN projects p ON p.id=t.project_id
    JOIN profiles requester ON requester.id=$2 AND requester.is_active=true
    LEFT JOIN project_members pm ON pm.project_id=t.project_id AND pm.user_id=$2
    LEFT JOIN task_assignees ta ON ta.task_id=t.id AND ta.user_id=$2
    WHERE t.id=$1 AND t.archived_at IS NULL AND (p.created_by=$2 OR pm.user_id IS NOT NULL OR ta.user_id IS NOT NULL)`, [taskId, user.id]);
  return result.rowCount > 0;
}
export const canUpdateChecklist = canReadTask;
export const canCommentOnTask = canReadTask;
