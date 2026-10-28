import { betterAuthHandler } from '../server/auth.js';

export default function handler(request, response) {
  const url = new URL(request.url || '/', 'http://localhost');
  const internalPath = url.searchParams.get('__auth_path');
  if (internalPath) {
    url.searchParams.delete('__auth_path');
    const query = url.searchParams.toString();
    request.url = `${internalPath}${query ? `?${query}` : ''}`;
  }
  return betterAuthHandler(request, response);
}
