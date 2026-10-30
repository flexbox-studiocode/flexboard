import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './Button.jsx'
import './date-picker.css'

const pad = n => String(n).padStart(2, '0')
const iso = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const parse = value => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null; const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d) }
const label = value => { const d = parse(value); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '' }
const monthNames = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })

export default function DatePicker({ label: fieldLabel = 'Tenggat', value = '', onChange, id, required = false }) {
  const [open, setOpen] = useState(false)
  const selected = parse(value)
  const [view, setView] = useState(() => selected || new Date())
  // Sync the calendar view to the selected date when the value prop changes.
  // Using a state tracker (not a ref) keeps this safe under React's render rules.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (selected) setView(selected)
  }
  const root = useRef(null)
  useEffect(() => {
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
    const leading = (first.getDay() + 6) % 7
    return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))]
  }, [view])
  const choose = date => { onChange?.(iso(date)); setOpen(false) }
  const today = new Date()
  return <div className="date-picker field" ref={root}>
    <label htmlFor={id}>{fieldLabel}</label>
    <div className="date-picker__control">
      <input id={id} value={label(value)} placeholder="DD/MM/YYYY" readOnly required={required} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }} />
      <CalendarDays size={19} aria-hidden="true" />
    </div>
    {open && <div className="date-picker__popover" role="dialog" aria-label="Pilih tanggal">
      <div className="date-picker__header"><button type="button" aria-label="Bulan sebelumnya" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><strong>{monthNames.format(view)}</strong><button type="button" aria-label="Bulan berikutnya" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
      <div className="date-picker__weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="date-picker__days">{days.map((date, i) => date ? <button type="button" key={iso(date)} className={`${selected && iso(selected) === iso(date) ? 'is-selected ' : ''}${iso(today) === iso(date) ? 'is-today' : ''}`} aria-label={date.toLocaleDateString('id-ID')} aria-pressed={selected ? iso(selected) === iso(date) : false} onClick={() => choose(date)}>{date.getDate()}</button> : <span key={`empty-${i}`} />)}</div>
      <div className="date-picker__actions"><Button type="button" variant="ghost" onClick={() => choose(today)}>Today</Button><Button type="button" variant="ghost" onClick={() => { onChange?.(''); setOpen(false) }}><X size={15} />Clear</Button></div>
    </div>}
  </div>
}
