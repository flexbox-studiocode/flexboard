import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton, Input } from '../../components/ui/index.js'

// Only user-entered form state. No task, progress, or completion is simulated.
export default function ChecklistDraft({ disabled = false }) {
  const descriptionId = useId()
  const [items, setItems] = useState([])
  const [nextId, setNextId] = useState(1)
  const fieldset = useRef(null)
  const pendingFocus = useRef(null)

  useLayoutEffect(() => {
    if (pendingFocus.current === null) return
    const selector = pendingFocus.current === 'add'
      ? '[data-add-checklist]'
      : `[data-checklist-id="${pendingFocus.current}"] input`
    fieldset.current?.querySelector(selector)?.focus()
    pendingFocus.current = null
  }, [items])

  function addItem() {
    pendingFocus.current = nextId
    setItems(previous => [...previous, { id: nextId, title: '' }])
    setNextId(previous => previous + 1)
  }

  function removeItem(id) {
    const index = items.findIndex(item => item.id === id)
    pendingFocus.current = items[index + 1]?.id ?? items[index - 1]?.id ?? 'add'
    setItems(previous => previous.filter(item => item.id !== id))
  }

  function updateItem(id, title) {
    setItems(previous => previous.map(item => item.id === id ? { ...item, title } : item))
  }

  return <fieldset ref={fieldset} className="checklist-draft" disabled={disabled} aria-describedby={descriptionId}>
    <legend>Rancangan checklist</legend>
    <p id={descriptionId} className="muted">Susun item pekerjaan secara lokal. Item belum dibuat di server, tidak dapat ditandai selesai, dan tidak menghasilkan progres.</p>
    <div className="stack">
      {items.map((item, index) => <div key={item.id} data-checklist-id={item.id} className="checklist-draft__row">
        <Input label={`Item checklist ${index + 1}`} value={item.title} onChange={event => updateItem(item.id, event.target.value)} autoComplete="off" />
        <IconButton label={`Hapus item checklist ${index + 1}`} onClick={() => removeItem(item.id)}><Trash2 size={18} aria-hidden="true" /></IconButton>
      </div>)}
    </div>
    <Button variant="secondary" data-add-checklist onClick={addItem}><Plus size={17} aria-hidden="true" />Tambah item checklist</Button>
    <p className="checklist-draft__count" role="status">{items.length} item dalam rancangan lokal.</p>
  </fieldset>
}
