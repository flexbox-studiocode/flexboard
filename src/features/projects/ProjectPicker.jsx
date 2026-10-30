import { useEffect, useId, useState } from 'react'
import { Button, Select } from '../../components/ui/index.js'
import { listProjects } from '../tasks/taskApi.js'
import ProjectDialog from './ProjectDialog.jsx'
import './projects.css'

export default function ProjectPicker({ value, onChange, lazy = false }) {
  const [projects, setProjects] = useState([]); const [open, setOpen] = useState(false); const [error, setError] = useState(''); const [loaded, setLoaded] = useState(false); const hintId = useId()
  function load() {
    listProjects()
      .then(data => { setProjects(data?.projects || []); setLoaded(true) })
      .catch(() => setError('Daftar proyek gagal dimuat.'))
  }
  useEffect(() => { if (!lazy) load() }, [lazy])
  function openDialog() { if (!loaded) load(); setOpen(true) }
  return <div className="project-picker">
    <div className="project-picker__controls"><Select label="Proyek" value={value || ''} onChange={e => onChange?.(e.target.value)} aria-describedby={hintId}><option value="">Pilih proyek</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</Select><Button type="button" variant="secondary" onClick={openDialog}>Buat proyek</Button></div>
    <small id={hintId} className="field__hint">{error || 'Proyek aktif yang dapat Anda akses.'}</small>
    <ProjectDialog open={open} onClose={() => setOpen(false)} onSaved={load} />
  </div>
}
