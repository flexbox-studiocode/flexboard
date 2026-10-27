import { Modal } from '../../components/ui/index.js'
import ProjectForm from './ProjectForm.jsx'
import './projects.css'

/** Mount only while open; changing mode also discards the local draft. */
export default function ProjectDialog({ open, onClose, mode = 'new' }) {
  return <Modal open={open} onClose={onClose} title={mode === 'new' ? 'Pratinjau form proyek' : 'Pratinjau edit proyek'}>
    {open && <ProjectForm key={mode} mode={mode} onClose={onClose} />}
  </Modal>
}
