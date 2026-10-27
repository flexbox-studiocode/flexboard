import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, ProgressBar } from '../../components/ui/index.js'
import './tasks.css'

/** Presentational only. Labels, dates, permissions, and progress must come from an approved data adapter. */
export default function TaskCard({ title, detailPath, projectLabel, statusLabel, priorityLabel, dueLabel, assignees = [], progress, progressLabel }) {
  return <article className="task-card"><div className="task-card-top"><span className="feature-eyebrow">{projectLabel || 'Proyek belum tersedia'}</span>{priorityLabel && <Badge tone="neutral">{priorityLabel}</Badge>}</div><h3>{detailPath ? <Link to={detailPath}>{title}<ArrowUpRight size={16} aria-hidden="true" /></Link> : title}</h3>{statusLabel && <Badge tone="info">{statusLabel}</Badge>}<div className="task-card-progress"><ProgressBar value={progress} label={progressLabel || 'Progres tugas'} unavailableLabel="Progres belum tersedia" /></div><div className="task-card-footer"><span><CalendarDays size={15} aria-hidden="true" />{dueLabel || 'Tenggat belum tersedia'}</span><ul className="task-card-assignees" aria-label="Penanggung jawab">{assignees.map(person => <li key={person.id}><Avatar name={person.name} src={person.src} /><span className="sr-only">{person.name}</span></li>)}</ul></div></article>
}
