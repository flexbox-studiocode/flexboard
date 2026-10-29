import { useEffect, useId, useState } from 'react'
import { createProject, listMembers } from '../tasks/taskApi.js'
import { Button, Input, Textarea, UnavailableState } from '../../components/ui/index.js'
import './projects.css'

/** Local preview only. Edit mode never assumes project data or authorization. */
export default function ProjectForm({ mode: _mode = 'new', onClose, onSaved }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState('corporate_enterprise'); const [members, setMembers] = useState([]); const [selected, setSelected] = useState([]); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const noteId = useId()
  useEffect(() => { listMembers().then(data => setMembers(data?.members || [])).catch(() => setError('Daftar anggota gagal dimuat.')) }, [])
  async function submit(event) { event.preventDefault(); if (!name.trim()) return setError('Nama proyek wajib diisi.'); setSaving(true); setError(''); try { const result = await createProject({ name, description, category, memberIds: selected }); onSaved?.(result); onClose() } catch (e) { setError(e.message === 'HTTP_403' ? 'Anda tidak memiliki izin.' : 'Proyek gagal disimpan.') } finally { setSaving(false) } }
  return <form className="project-dialog-form" aria-describedby={noteId} onSubmit={submit}>
    <p className="feature-note" id={noteId}>Pilih anggota aktif yang benar-benar bergabung dalam proyek.</p>{error && <UnavailableState title={error} />}
    <Input label="Nama proyek" name="name" value={name} onChange={event => setName(event.target.value)} placeholder="Tuliskan nama proyek" autoComplete="off" required />
    <Textarea label="Deskripsi proyek" name="description" value={description} onChange={event => setDescription(event.target.value)} rows={4} placeholder="Jelaskan tujuan dan ruang lingkup proyek" />
    <label htmlFor="project-category">Kategori proyek</label><select id="project-category" value={category} onChange={e => setCategory(e.target.value)}><option value="corporate_enterprise">Corporate & Enterprise</option><option value="startup_sme">Startup & SME (UMKM)</option><option value="government_public">Government & Public Sector</option><option value="educational_community">Educational & Community</option></select><div className="field"><label htmlFor="project-members">Anggota proyek</label><select id="project-members" multiple value={selected} onChange={e => setSelected([...e.target.selectedOptions].map(o => o.value))}>{members.filter(m => m.role === 'member' && m.is_active !== false).map(m => <option key={m.id} value={m.id}>{m.display_name || m.displayName}</option>)}</select></div>
    <div className="project-dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan proyek'}</Button></div>
  </form>
}
