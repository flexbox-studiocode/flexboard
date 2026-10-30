import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

const memberLabel = member => {
  const name = member.display_name || member.displayName || ''
  const job = member.job_title || member.jobTitle
  return job ? `${name} · ${job}` : name
}
const match = (member, query) => {
  if (!query) return true
  const q = query.toLowerCase()
  const name = (member.display_name || member.displayName || '').toLowerCase()
  const job = (member.job_title || member.jobTitle || '').toLowerCase()
  const email = (member.email || '').toLowerCase()
  return name.includes(q) || job.includes(q) || email.includes(q)
}

// Multi-assignee control. Deliberately occupies the same block footprint the single `<select multiple>`
// used to (>= 96px, see refinement.spec.js) so the form keeps its proportions: selected people render as
// chips above a search field that filters the remaining project members.
export default function AssigneePicker({ members = [], selected = [], onChange, disabled = false }) {
  const [query, setQuery] = useState('')
  const selectedIds = new Set(selected.map(id => id))
  const chosen = useMemo(() => selected.map(id => members.find(m => m.id === id)).filter(Boolean), [selected, members])
  const available = members.filter(m => !selectedIds.has(m.id) && match(m, query))
  return <div className="assignee-picker">
    <label htmlFor="assignee-search">Penanggung jawab</label>
    <div className="assignee-picker__control">
      <div className="assignee-picker__chips" aria-live="polite">
        {chosen.map(member => <span key={member.id} className="assignee-chip">{memberLabel(member)}<button type="button" aria-label={`Hapus ${member.display_name || member.displayName}`} disabled={disabled} onClick={() => onChange(selected.filter(id => id !== member.id))}><X size={14} /></button></span>)}
      </div>
      <div className="assignee-picker__search">
        <Search size={17} aria-hidden="true" />
        <input id="assignee-search" type="search" placeholder="Cari anggota proyek…" value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} aria-describedby="assignee-hint" />
      </div>
    </div>
    {available.length > 0 ? <ul className="assignee-picker__options" role="listbox" aria-label="Anggota proyek yang dapat dipilih" aria-multiselectable="true">
      {available.map(member => <li key={member.id} role="option" aria-selected={selectedIds.has(member.id)}><button type="button" disabled={disabled} onClick={() => { onChange([...selected, member.id]); setQuery('') }}>{memberLabel(member)}</button></li>)}
    </ul> : <small id="assignee-hint" className="field__hint">{members.length ? (selected.length === members.length ? 'Seluruh anggota proyek telah dipilih.' : query ? 'Tidak ada anggota yang cocok dengan pencarian.' : 'Proyek ini belum memiliki anggota aktif lain.') : 'Proyek ini belum memiliki anggota aktif. Pilih proyek atau tambahkan anggota ke proyek terlebih dahulu.'}</small>}
  </div>
}
