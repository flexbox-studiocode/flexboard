import { Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, UnavailableState } from '../../components/ui/index.js'
import './activity.css'

/** Text comes from a verified adapter, never a client-generated success log. */
export default function ActivityList({ entries }) {
  if (!Array.isArray(entries)) return <UnavailableState title="Riwayat belum tersedia" description="Aktivitas akan ditampilkan setelah catatan server berhasil dimuat sesuai akses." />
  if (entries.length === 0) return <EmptyState title="Belum ada aktivitas" description="Belum ada catatan aktivitas dalam cakupan yang dimuat." />
  return <ol className="activity-list">{entries.map(entry => <li key={entry.id}>
    <span className="activity-list__mark"><Clock3 size={18} aria-hidden="true" /></span>
    <div><p><strong>{entry.actorLabel}</strong> {entry.actionLabel} {entry.objectPath ? <Link to={entry.objectPath}>{entry.objectLabel}</Link> : entry.objectLabel}</p>
      {entry.timeLabel && (entry.dateTime ? <time dateTime={entry.dateTime}>{entry.timeLabel}</time> : <span className="activity-list__time">{entry.timeLabel}</span>)}</div>
  </li>)}</ol>
}
