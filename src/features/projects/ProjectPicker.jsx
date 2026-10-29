import { useEffect, useId, useState } from 'react'
import { Button, Select } from '../../components/ui/index.js'
import { listProjects } from '../tasks/taskApi.js'
import ProjectDialog from './ProjectDialog.jsx'
import './projects.css'

export default function ProjectPicker({ value, onChange }) {
  const [projects, setProjects] = useState([]); const [open, setOpen] = useState(false); const [error, setError] = useState(''); const hintId = useId()
  function load() { listProjects().then(data => setProjects(data?.projects || [])).catch(() => setError('Daftar proyek gagal dimuat.')) }
  useEffect(load, [])
  return <div className="project-picker">
    <div className="project-picker__controls"><Select label="Proyek" value={value || ''} onChange={e => onChange?.(e.target.value)} aria-describedby={hintId}><option value="">Pilih proyek</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</Select><Button type="button" variant="secondary" onClick={() => setOpen(true)}>Buat proyek</Button></div>
    <small id={hintId} className="field__hint">{error || 'Proyek aktif yang dapat Anda akses.'}</small>
    <ProjectDialog open={open} onClose={() => setOpen(false)} onSaved={load} />
  </div>
}
