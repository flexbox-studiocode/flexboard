import { Checkbox } from '../../components/ui/index.js'
import './tasks.css'

export default function ChecklistItem({ title, completed = false, canEdit = false, saving = false, onChange, assigneeLabel }) {
  return <div className={`task-checklist-item${completed ? ' task-checklist-item--completed' : ''}`}><Checkbox label={title} checked={completed} disabled={!canEdit || saving || !onChange} onChange={event => onChange?.(event.target.checked)} />{assigneeLabel && <span>{assigneeLabel}</span>}{saving && <span role="status">Menyimpan…</span>}</div>
}
