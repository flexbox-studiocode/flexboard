/**
 * Vercel filesystem routing only maps a request to `api/<name>.js` when the URL
 * is exactly `/api/<name>`. Nested resources such as `/api/tasks/:id` and
 * `/api/projects/:id/members` therefore need an explicit rewrite that carries
 * the original path along, the same way `api/auth.js` carries `__auth_path`.
 */
export function withOriginalPath(handler) {
  return async function route(request, response) {
    const original = request.url && new URL(request.url, 'http://localhost').searchParams.get('__path')
    if (original) {
      const url = new URL(request.url, 'http://localhost')
      url.searchParams.delete('__path')
      const query = url.searchParams.toString()
      request.url = `${original}${query ? `?${query}` : ''}`
    }
    return handler(request, response)
  }
}
