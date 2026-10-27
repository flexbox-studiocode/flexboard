import { EmptyState, ErrorState, LoadingState, UnavailableState } from '../../components/ui/index.js'

/** Only renders current data. Loading/error never retain previous rows or raw server errors. */
export default function CollectionState({ state, unavailable, empty, loadingTitle, errorTitle, children }) {
  if (state.status === 'loading') return <LoadingState title={loadingTitle} />
  if (state.status === 'error') return <ErrorState title={errorTitle} onRetry={state.onRetry} />
  if (state.status !== 'success') return <UnavailableState {...unavailable} />
  if (state.items.length === 0) return <EmptyState {...empty} />
  return children(state.items)
}
