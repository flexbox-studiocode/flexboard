import { Button, EmptyState, Panel, ProgressBar, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ChecklistItem from './ChecklistItem.jsx'

/** Controlled presentation, not an endpoint schema or a progress calculator. */
export default function TaskChecklistSection({ items, progress, onItemChange, onAdd, canAdd = false, savingItemId }) {
  const available = Array.isArray(items)
  return <Panel className="feature-panel">
    <SectionHeading eyebrow="WORK BREAKDOWN" title="Checklist & progres" description="Penyelesaian item dan progres mengikuti hasil tersimpan dari server." />
    <ProgressBar value={available ? progress : undefined} label="Progres tugas" unavailableLabel="Progres belum tersedia" />
    {!available ? <UnavailableState title="Checklist belum tersedia" description="Checklist tidak dapat ditampilkan atau diubah sebelum data tugas dan izin berhasil diverifikasi." />
      : items.length === 0 ? <EmptyState title="Belum ada checklist" description="Pekerjaan belum memiliki checklist aktif. Tidak ada progres yang disimpulkan dari keadaan ini." />
        : <ul className="task-checklist-list">{items.map(item => <li key={item.id}><ChecklistItem title={item.title} completed={item.completed} canEdit={item.canEdit === true} saving={savingItemId === item.id} assigneeLabel={item.assigneeLabel} onChange={onItemChange ? checked => onItemChange(item.id, checked) : undefined} /></li>)}</ul>}
    <div className="task-disabled-actions"><Button variant="secondary" disabled={!available || !canAdd || !onAdd || savingItemId != null} onClick={onAdd}>Tambah checklist</Button></div>
  </Panel>
}
