import { Avatar, Badge, Panel, ProgressBar } from '../../components/ui/index.js'
import './members.css'

const displayLabel = value => typeof value === 'string' && value.trim() ? value : '—'

// Presentation only: callers supply labels and server-derived measurements.
export default function MemberCard({ name, display_name, roleLabel, role, statusLabel, is_active, job_title, activeTaskCount, progress }) {
  name = name || display_name
  roleLabel = roleLabel || `${job_title ? `${job_title} · ` : ''}${role === 'leader' ? 'Leader' : role === 'member' ? 'Member' : ''}`
  // Only a real boolean can claim a status; unknown stays unavailable rather than "Tidak aktif".
  statusLabel = statusLabel || (typeof is_active === 'boolean' ? (is_active ? 'Aktif' : 'Tidak aktif') : '')
  const countAvailable = Number.isSafeInteger(activeTaskCount) && activeTaskCount >= 0

  return <Panel className="member-card">
    <div className="member-card__heading">
      <Avatar name={typeof name === 'string' ? name : ''} />
      <div><h3>{displayLabel(name)}</h3><p>{displayLabel(roleLabel)}</p></div>
    </div>
    <dl className="member-card__details">
      <div><dt>Status akun</dt><dd><Badge>{displayLabel(statusLabel)}</Badge></dd></div>
      <div><dt>Tugas aktif</dt><dd>{countAvailable ? activeTaskCount : '—'}</dd></div>
    </dl>
    <ProgressBar value={progress} label="Progres pekerjaan" unavailableLabel="Belum tersedia" />
  </Panel>
}
