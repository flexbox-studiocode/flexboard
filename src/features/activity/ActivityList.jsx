import { Link } from 'react-router-dom'
import { Avatar, EmptyState, UnavailableState } from '../../components/ui/index.js'
import './activity.css'

/** Text comes from a verified adapter, never a client-generated success log. */
export default function ActivityList({ entries }) {
  if (!Array.isArray(entries)) return <UnavailableState title="Riwayat belum tersedia" description="Layanan aktivitas belum terhubung. Aktivitas akan ditampilkan setelah catatan server berhasil dimuat sesuai akses. Tidak ada peristiwa, aktor, atau waktu contoh yang ditampilkan." />
  if (entries.length === 0) return <EmptyState title="Belum ada aktivitas" description="Belum ada catatan aktivitas dalam cakupan yang dimuat." />
  return <ol className="activity-list">{entries.map(entry => <li key={entry.id}>
    <Avatar name={typeof entry.actorLabel === 'string' ? entry.actorLabel : ''} className="activity-list__avatar" />
    <div className="activity-list__content"><p className="activity-list__title"><strong>{entry.actorLabel}</strong> {entry.actionLabel} {entry.objectPath ? <Link to={entry.objectPath}>{entry.objectLabel}</Link> : entry.objectLabel}</p>
      <div className="activity-list__meta">{entry.projectLabel && <span className="activity-list__project">{entry.projectLabel}</span>}{entry.timeLabel && (entry.dateTime ? <time dateTime={entry.dateTime}>{entry.timeLabel}</time> : <span className="activity-list__time">{entry.timeLabel}</span>)}</div>
      {entry.description && <p className="activity-list__description">{entry.description}</p>}
    </div>
  </li>)}</ol>
}
