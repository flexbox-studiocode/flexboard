import { me } from '../../server/auth.js';
export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } });
  return me(request, response);
}
