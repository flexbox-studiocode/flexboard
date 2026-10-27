import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from './Button.jsx'

export function Modal({ open, onClose, title, children, className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const previousFocus = document.activeElement
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open])
  function containFocus(event) {
    if (event.key !== 'Tab') return
    const elements = [...ref.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length > 0)
    const first = elements[0]
    const last = elements.at(-1)
    if (!first) { event.preventDefault(); return }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  function dismissBackdrop(event) {
    if (event.target !== ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom
    if (outside) onClose()
  }
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={titleId} onKeyDown={containFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={dismissBackdrop}>
    <div className="modal__heading"><h2 id={titleId}>{title}</h2><IconButton label="Tutup dialog" onClick={onClose}><X size={21} /></IconButton></div>
    {open && children}
  </dialog>
}
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Konfirmasi tindakan', description, confirmLabel = 'Lanjutkan', loading = false, disabled = false }) {
  return <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
    <p>{description}</p><div className="dialog-actions"><Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button><Button variant="danger" onClick={onConfirm} disabled={disabled} loading={loading}>{confirmLabel}</Button></div>
  </Modal>
}
