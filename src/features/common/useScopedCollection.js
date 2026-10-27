import { useLocation } from 'react-router-dom'

/** Internal UI state, not an API schema. Scope must identify the exact displayed URL. */
export default function useScopedCollection(resource) {
  const { pathname, search } = useLocation()
  if (!resource || resource.scope !== `${pathname}${search}`) return { status: 'unavailable' }
  const onRetry = typeof resource.onRetry === 'function' ? resource.onRetry : undefined
  switch (resource.status) {
    case 'loading': return { status: 'loading' }
    case 'error': return { status: 'error', onRetry }
    case 'success':
      return Array.isArray(resource.items)
        ? { status: 'success', items: resource.items }
        : { status: 'error', onRetry }
    default: return { status: 'unavailable' }
  }
}
