import { Button } from './Button.jsx'

export function Pagination({ page, pageCount, onPageChange, disabled = false, label = 'Navigasi halaman' }) {
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(pageCount) || pageCount <= 0 || page < 1 || page > pageCount) return null

  const unavailable = disabled || typeof onPageChange !== 'function'
  const previousDisabled = unavailable || page === 1
  const nextDisabled = unavailable || page === pageCount

  return <nav className="pagination" aria-label={label}>
    <Button variant="secondary" className="pagination__previous" disabled={previousDisabled} onClick={() => { if (!previousDisabled) onPageChange(page - 1) }}>Sebelumnya</Button>
    <p className="pagination__summary" aria-live="polite" aria-atomic="true">Halaman <span aria-current="page">{page}</span> dari {pageCount}</p>
    <Button variant="secondary" className="pagination__next" disabled={nextDisabled} onClick={() => { if (!nextDisabled) onPageChange(page + 1) }}>Berikutnya</Button>
  </nav>
}
