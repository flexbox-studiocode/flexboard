import { ArrowUpRight, CalendarDays, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input, SearchField, Select } from '../../components/ui/index.js'
import { readDateFilter } from './dateFilters.js'
import './features.css'

export function SectionHeading({ eyebrow, title, description, to, linkLabel }) {
  return <div className="feature-section-heading"><div>{eyebrow && <p className="feature-eyebrow sr-only">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{to && <Link className="feature-text-link" to={to}>{linkLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>
}

export function MetricCard({ label, icon: Icon, caption, tone = 'blue' }) {
  return <article className={`feature-metric feature-metric--${tone}`}><div className="feature-metric-top"><span>{label}</span><span className="feature-metric-icon"><Icon size={19} aria-hidden="true" /></span></div><strong aria-label="Data belum tersedia">—</strong><p>{caption || 'Data belum tersedia'}</p></article>
}

export function FilterToolbar({ placeholder = 'Cari…', member = false, dates = false, taskFilters = false }) {
  const [params, setParams] = useSearchParams()
  const from = readDateFilter(params, 'from')
  const to = readDateFilter(params, 'to')
  const rangeError = dates && !from.error && !to.error && from.value && to.value && from.value > to.value
    ? 'Rentang tanggal tidak valid. Tanggal mulai harus sebelum atau sama dengan tanggal akhir.'
    : undefined
  const dateError = dates && (from.error || to.error || rangeError)
  const update = (name, value) => {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(name, value)
      else next.delete(name)
      return next
    }, { replace: true })
  }
  const hasFilters = ['q', 'from', 'to', 'project', 'member', 'status', 'priority'].some(key => params.has(key))
  const reset = () => setParams(previous => {
    const next = new URLSearchParams(previous)
    for (const key of ['q', 'from', 'to', 'project', 'member', 'status', 'priority']) next.delete(key)
    return next
  }, { replace: true })
  return <div className="feature-filters"><div className="feature-filter-search"><SearchField label="Pencarian" placeholder={placeholder} value={params.get('q') || ''} onChange={event => update('q', event.target.value)} /></div><div className="feature-filter-options"><span className="feature-filter-label"><SlidersHorizontal size={16} aria-hidden="true" />Filter</span><Select label="Proyek" value="" disabled><option value="">Proyek belum tersedia</option></Select>{member && <Select label="Anggota" value="" disabled><option value="">Anggota belum tersedia</option></Select>}{taskFilters && <><Select label="Status" value="" disabled><option value="">Status belum tersedia</option></Select><Select label="Prioritas" value="" disabled><option value="">Prioritas belum tersedia</option></Select></>}{dates && <><Input label="Dari tanggal" type="date" value={from.value} error={from.error || rangeError} onChange={event => update('from', event.target.value)} /><Input label="Sampai tanggal" type="date" min={from.value || undefined} value={to.value} error={to.error || rangeError} onChange={event => update('to', event.target.value)} /></>}<Button variant="ghost" onClick={reset} disabled={!hasFilters}>Reset filter</Button></div><p className="feature-filter-notice" role="status">{dateError ? 'Filter tidak valid. Pencarian dan filter tidak dijalankan. Perbaiki tanggal atau reset filter; pilihan tetap tersimpan di URL.' : hasFilters ? 'Pilihan tersimpan di URL. Pencarian dan filter belum dijalankan karena layanan data belum terhubung.' : 'Pencarian dan filter akan menggunakan data sesuai akses setelah layanan terhubung.'}</p></div>
}

export function DataNotice({ title = 'Data langsung dari sumbernya', children }) {
  return <aside className="feature-data-notice"><span className="feature-data-notice-icon"><CalendarDays size={22} aria-hidden="true" /></span><div><p className="feature-eyebrow">SUMBER DATA</p><h3>{title}</h3><p>{children}</p></div></aside>
}
