import { toNodeHandler } from 'better-auth/node';
import { auth } from './better-auth.config.js';
import { getPool } from './db/pool.js';

export { auth };
export const betterAuthHandler = toNodeHandler(auth);

// Capability matrix evaluated on the server for every request. UI may read these flags
// but must never be the only gate — endpoints re-check role server-side.
//   leader  : full control (accounts, roles, projects, tasks) — cannot be revoked by admin/member.
//   admin   : operational help (projects/tasks, manage members only, never other admins/leaders).
//   member  : read scoped work, toggle owned checklist, comment, report updates.
export function capabilities(user) {
  const role = user?.role;
  const leader = role === 'leader';
  const admin = role === 'admin';
  const manager = leader || admin;
  return {
    readProgress: true,
    readTasks: true,
    checklist: true,
    comment: true,
    createTask: manager,
    editTask: manager,
    archiveTask: manager,
    manageAssignments: manager,
    // Project create/update/members is Leader-only by product policy (see server/authorization.js).
    manageProjects: leader,
    manageMembers: manager,
    changeRoles: leader,
    manageAdmins: leader,
    manageLeaders: false,
  };
}

export async function getAuthenticatedProfile(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const result = await getPool().query(`SELECT id, display_name, role, is_active, job_title, auth_subject
    FROM profiles WHERE auth_subject=$1 AND is_active=true`, [session.user.id]);
  const profile = result.rows[0];
  if (!profile?.is_active) return null;
  return { session, profile };
}

export async function me(request, response) {
  const authenticated = await getAuthenticatedProfile(request);
  if (!authenticated) return response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  const { session, profile } = authenticated;
  return response.status(200).json({ data: { user: { id: profile.id, authSubject: profile.auth_subject || session.user.id, email: session.user.email, displayName: profile.display_name, jobTitle: profile.job_title || null, role: profile.role }, capabilities: capabilities(profile) } });
}

// Self-service profile update. Users may only change their own displayName/jobTitle — never
// role or active status (those are privileged and enforced by the members endpoints).
export async function updateMe(request, response) {
  const authenticated = await getAuthenticatedProfile(request);
  if (!authenticated) return response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  const { profile } = authenticated;
  const body = request.body && typeof request.body === 'object' ? request.body : {};
  const sets = [];
  const values = [];
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length < 2)
      return response.status(400).json({ error: { code: 'VALIDATION', message: 'displayName must be at least 2 characters.' } });
    values.push(body.displayName.trim());
    sets.push(`display_name=$${values.length}`);
  }
  if (body.jobTitle !== undefined) {
    if (body.jobTitle !== null && typeof body.jobTitle !== 'string')
      return response.status(400).json({ error: { code: 'VALIDATION', message: 'jobTitle must be a string.' } });
    values.push(body.jobTitle ? body.jobTitle.trim() || null : null);
    sets.push(`job_title=$${values.length}`);
  }
  if (!sets.length) return response.status(400).json({ error: { code: 'VALIDATION', message: 'No updatable fields supplied.' } });
  values.push(profile.id);
  const result = await getPool().query(`UPDATE profiles SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length} AND is_active=true RETURNING id,display_name,role,job_title`, values);
  const updated = result.rows[0];
  if (!updated) return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profile not found.' } });
  return response.status(200).json({ data: { user: { id: updated.id, displayName: updated.display_name, jobTitle: updated.job_title || null, role: updated.role }, capabilities: capabilities(updated) } });
}
