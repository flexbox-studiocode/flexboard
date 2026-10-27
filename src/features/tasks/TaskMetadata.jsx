import { Avatar, Badge } from '../../components/ui/index.js'

/** Presentation labels only; an approved API adapter must supply verified values. */
export default function TaskMetadata({ projectLabel, assignees, dueLabel, priorityLabel, statusLabel, weightLabel }) {
  const unavailable = <span className="muted">Belum tersedia</span>
  return <dl className="task-metadata">
    <div><dt>Proyek</dt><dd>{projectLabel || unavailable}</dd></div>
    <div><dt>Penanggung jawab</dt><dd>{assignees?.length ? <ul className="task-metadata__assignees">{assignees.map(person => <li key={person.id}><Avatar name={person.name} src={person.src} /><span>{person.name}</span></li>)}</ul> : unavailable}</dd></div>
    <div><dt>Tenggat</dt><dd>{dueLabel || unavailable}</dd></div>
    <div><dt>Prioritas</dt><dd>{priorityLabel ? <Badge>{priorityLabel}</Badge> : unavailable}</dd></div>
    <div><dt>Status tugas</dt><dd>{statusLabel ? <Badge tone="info">{statusLabel}</Badge> : unavailable}</dd></div>
    <div><dt>Bobot</dt><dd>{weightLabel || unavailable}</dd></div>
  </dl>
}
