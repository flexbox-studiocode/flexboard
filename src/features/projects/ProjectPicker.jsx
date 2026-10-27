import { useState } from 'react'
import { Button, Select } from '../../components/ui/index.js'
import ProjectDialog from './ProjectDialog.jsx'
import ProjectArchiveDialog from './ProjectArchiveDialog.jsx'
import './projects.css'

/** Public preview, not a project list or evidence of management permissions. */
export default function ProjectPicker() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  return <div className="project-picker">
    <div className="project-picker__controls">
      <Select label="Proyek" value="" disabled hint="Daftar proyek dan hak akses belum tersedia."><option value="">Pilihan proyek belum tersedia</option></Select>
      <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>Pratinjau form proyek</Button>
    </div>
    <p className="feature-note">Pratinjau dapat dibuka tanpa memilih proyek. Ini bukan akses pengelolaan proyek; input tidak disimpan dan dibuang saat ditutup.</p>
    <details className="project-picker__previews"><summary>Pratinjau struktur pengelolaan</summary><div className="cluster"><Button variant="ghost" onClick={() => setEditOpen(true)}>Pratinjau edit proyek</Button><Button variant="ghost" onClick={() => setArchiveOpen(true)}>Pratinjau konfirmasi arsip</Button></div></details>
    <ProjectDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
    <ProjectDialog open={editOpen} onClose={() => setEditOpen(false)} mode="edit" />
    <ProjectArchiveDialog open={archiveOpen} onClose={() => setArchiveOpen(false)} />
  </div>
}
