import { toNodeHandler } from 'better-auth/node';
import { auth } from './better-auth.config.js';
import { getPool } from './db/pool.js';

export { auth };
export const betterAuthHandler = toNodeHandler(auth);

export function capabilities(user) {
  const leader = user.role === 'leader';
  return { readProgress: true, readTasks: true, checklist: true, comment: true, createTask: leader, archiveTask: leader, manageAssignments: leader, manageMembers: leader };
}

export async function getAuthenticatedProfile(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const result = await getPool().query(`SELECT id, display_name, role, is_active
    FROM profiles WHERE auth_subject=$1 AND is_active=true`, [session.user.id]);
  const profile = result.rows[0];
  if (!profile?.is_active) return null;
  return { session, profile };
}

export async function me(request, response) {
  const authenticated = await getAuthenticatedProfile(request);
  if (!authenticated) return response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  const { session, profile } = authenticated;
  return response.status(200).json({ data: { user: { id: profile.id, authSubject: session.user.id, email: session.user.email, displayName: profile.display_name, role: profile.role }, capabilities: capabilities(profile) } });
}
