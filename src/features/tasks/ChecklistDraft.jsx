import { useId, useLayoutEffect, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton, Input } from '../../components/ui/index.js'
import settleMotion from '../../components/ui/settleMotion.js'
import useEntryMotion from '../../components/ui/useEntryMotion.js'

// Only user-entered form state. No task, progress, or completion is simulated.
export default function ChecklistDraft({ items = [], onChange, disabled = false }) {
  const descriptionId = useId()
  const nextId = useRef(1)
  const fieldset = useRef(null)
  const pendingFocus = useRef(null)
  const readOnly = disabled || typeof onChange !== 'function'
  useEntryMotion(fieldset)

  useLayoutEffect(() => {
    const pending = pendingFocus.current
    pendingFocus.current = null
    // Focus only an accepted request, never a later unrelated parent update.
    if (!pending || readOnly) return
    const accepted = items.length === pending.items.length && items.every((item, index) => (
      item.id === pending.items[index].id && item.title === pending.items[index].title
    ))
    if (!accepted) return
    const triggerStillFocused = document.activeElement === pending.trigger
    const removedTriggerLostFocus = !pending.trigger?.isConnected && document.activeElement === document.body
    if (!triggerStillFocused && !removedTriggerLostFocus) return
    const selector = pending.id === null
      ? '[data-add-checklist]'
      : `[data-checklist-id="${pending.id}"] input`
    fieldset.current?.querySelector(selector)?.focus()
  })

  function requestChange(nextItems, focusId) {
    pendingFocus.current = { items: nextItems, id: focusId, trigger: document.activeElement }
    onChange(nextItems)
  }

  function addItem() {
    if (readOnly) return
    // IDs are local UI identities, not persisted task/checklist IDs.
    const id = `${descriptionId}-${nextId.current++}`
    requestChange([...items, { id, title: '' }], id)
  }

  function removeItem(id) {
    if (readOnly) return
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return
    requestChange(items.filter(item => item.id !== id), items[index + 1]?.id ?? items[index - 1]?.id ?? null)
  }

  function updateItem(id, title) {
    if (readOnly) return
    pendingFocus.current = null
    onChange(items.map(item => item.id === id ? { ...item, title } : item))
  }

  return <fieldset ref={fieldset} className="checklist-draft" disabled={readOnly} aria-describedby={descriptionId}>
    <legend>Rancangan checklist</legend>
    <p id={descriptionId} className="muted">Susun item pekerjaan secara lokal. Item belum dibuat di server, tidak dapat ditandai selesai, dan tidak menghasilkan progres.</p>
    <div className="stack">
      {items.map((item, index) => <div key={item.id} data-checklist-id={item.id} data-motion-entry className="checklist-draft__row" onFocusCapture={settleMotion} onAnimationEnd={settleMotion}>
        <Input label={`Item checklist ${index + 1}`} value={item.title} onChange={event => updateItem(item.id, event.target.value)} autoComplete="off" />
        <IconButton label={`Hapus item checklist ${index + 1}`} onClick={() => removeItem(item.id)}><Trash2 size={18} aria-hidden="true" /></IconButton>
      </div>)}
    </div>
    <Button variant="secondary" data-add-checklist onClick={addItem}><Plus size={17} aria-hidden="true" />Tambah item checklist</Button>
    <p className="checklist-draft__count" role="status">{items.length} item dalam rancangan lokal.</p>
  </fieldset>
}
