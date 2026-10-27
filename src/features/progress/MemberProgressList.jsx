import { Link } from 'react-router-dom'
import { Avatar, EmptyState, ProgressBar, UnavailableState } from '../../components/ui/index.js'

const label = value => typeof value === 'string' && value.trim() ? value : '—'
const isProgress = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100

/** Presentation only. Entries and measurements must come from the server adapter. */
export default function MemberProgressList({ entries }) {
  if (!Array.isArray(entries)) return <UnavailableState title="Progres tim belum dapat dimuat" description="Layanan progres belum terhubung. Nama anggota, tugas pembentuk, dan persentase belum dapat ditampilkan. Data yang tidak tersedia tidak ditafsirkan sebagai progres 0%." />
  if (entries.length === 0) return <EmptyState title="Belum ada progres anggota" description="Tidak ada progres anggota dalam cakupan yang berhasil dimuat." />

  return <ul className="member-progress-list">{entries.map(entry => <li key={entry.id}>
    <div className="member-progress-list__member"><Avatar name={typeof entry.name === 'string' ? entry.name : ''} /><div><h3>{label(entry.name)}</h3><p>{label(entry.roleLabel)}</p></div></div>
    <div className="member-progress-list__project"><h4>{label(entry.projectLabel)}</h4>{entry.detailPath ? <Link to={entry.detailPath}>Lihat progres</Link> : <span>Rincian belum tersedia</span>}</div>
    <ProgressBar value={entry.progress} label={`Progres ${label(entry.name)}`} unavailableLabel="Belum tersedia" />
    <div className="member-progress-list__average"><strong>{isProgress(entry.averageProgress) ? `${Math.round(entry.averageProgress)}%` : '—'}</strong><span>rata-rata</span></div>
  </li>)}</ul>
}
