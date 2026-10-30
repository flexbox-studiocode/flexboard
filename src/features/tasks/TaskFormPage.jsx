import { useEffect, useState } from 'react'
import { ArrowLeft, Info, Save } from 'lucide-react'
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom'
import { Button, Input, PageHeader, Panel, Select, Textarea, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ChecklistDraft from './ChecklistDraft.jsx'
import { ScrollReveal } from '../../components/ui/ScrollReveal.jsx'
import { createTask, getTask, listMembers, listProjectMembers, listProjects, updateTask } from './taskApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { toChecklistItem } from '../common/apiAdapters.js'
import './tasks.css'

const initial = { title: '', description: '', dueAt: '', weight: '1', projectId: '', assigneeIds: [], priority: 'medium', status: 'todo', checklist: [] }

export default function TaskFormPage() {
  const { id } = useParams()
  // The edit route is recognised by its path, so a task whose id is literally "new" still edits.
  const editing = Boolean(useMatch('/tasks/:id/edit'))
  return <TaskForm key={editing ? `edit-${id}` : 'new'} editing={editing} id={editing ? id : undefined} />
}

function TaskForm({ editing, id }) {
  const navigate = useNavigate(); const { profile } = useAuth()
  const [draft, setDraft] = useState(initial); const [projects, setProjects] = useState([]); const [allMembers, setAllMembers] = useState([]); const [projectScope, setProjectScope] = useState({ projectId: '', members: [] }); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const projectMembers = draft.projectId && projectScope.projectId === draft.projectId ? projectScope.members : []
  const members = draft.projectId ? projectMembers : allMembers

  useEffect(() => {
    let active = true
    Promise.all([listProjects(), listMembers(), editing ? getTask(id) : Promise.resolve(null)])
      .then(([p, m, t]) => {
        if (!active) return
        setProjects(Array.isArray(p?.projects) ? p.projects : Array.isArray(p) ? p : [])
        setAllMembers(Array.isArray(m?.members) ? m.members : Array.isArray(m) ? m : [])
        if (t) {
          const raw = t?.task || t
          setDraft({
            ...initial,
            ...raw,
            projectId: raw.project_id || raw.projectId || '',
            dueAt: raw.due_at || raw.dueAt || '',
            assigneeIds: Array.isArray(raw.assignees) ? raw.assignees.map(x => x.id) : [],
            checklist: (Array.isArray(raw.checklist) ? raw.checklist : []).map(toChecklistItem),
          })
        }
      })
      .catch(() => setError('Data form gagal dimuat.'))
    return () => { active = false }
  }, [editing, id])

  useEffect(() => {
    if (!draft.projectId) return
    const projectId = draft.projectId
    let active = true
    listProjectMembers(projectId).then(data => {
      if (!active) return
      const next = Array.isArray(data?.members) ? data.members : Array.isArray(data) ? data : []
      setProjectScope({ projectId, members: next })
      setDraft(x => ({ ...x, assigneeIds: x.assigneeIds.filter(memberId => next.some(member => member.id === memberId)) }))
    }).catch(() => { if (active) { setProjectScope({ projectId, members: [] }); setError('Anggota proyek gagal dimuat.') } })
    return () => { active = false }
  }, [draft.projectId])

  const update = e => {
    const { name, value } = e.target
    setDraft(x => name === 'projectId'
      ? { ...x, projectId: value, assigneeIds: [], checklist: [], assigneeSearch: '' }
      : { ...x, [name]: value })
  }

  const updateAssignees = e => {
    const selected = [...e.target.selectedOptions].map(option => option.value)
    setDraft(x => ({ ...x, assigneeIds: selected }))
  }

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...draft, weight: Number(draft.weight), dueAt: draft.dueAt || null }
      const result = editing ? await updateTask(id, payload) : await createTask(payload)
      const taskId = editing ? id : (result?.task?.id || result?.id)
      navigate(`/tasks/${taskId}`)
    } catch (err) {
      setError(err.message === 'HTTP_403' ? 'Anda tidak memiliki izin.' : 'Tugas gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const updateChecklist = checklist => setDraft(x => ({ ...x, checklist }))
  const canSave = profile?.capabilities?.createTask === true || editing

  return <div className="feature-page task-form-page">
    <Link className="feature-back-link" to="/tasks"><ArrowLeft size={16} />Kembali ke Tugas Kami</Link>
    <PageHeader title={editing ? 'Edit tugas' : 'Form tugas baru'} description="Kelola tugas tersimpan untuk tim." />
    {error && <Panel><UnavailableState title={error} /></Panel>}
    <div className="task-form-layout">
      <Panel className="feature-panel task-form-panel" aria-label="Form informasi tugas">
        <form onSubmit={submit}>
          <SectionHeading title="Informasi tugas" description="Jelaskan pekerjaan dan konteks yang diperlukan oleh tim." />
          <div className="task-form-fields">
            <div className="task-form-hero-row">
              <Input label="Judul tugas" name="title" value={draft.title} onChange={update} required />
              <Input label="Tenggat" name="dueAt" type="datetime-local" value={draft.dueAt} onChange={update} />
            </div>
            <Textarea label="Deskripsi" name="description" value={draft.description || ''} onChange={update} rows={6} />
            <Select label="Proyek" name="projectId" value={draft.projectId} onChange={update} required>
              <option value="">Pilih proyek</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            {!projects.length && <p className="muted">Belum ada proyek yang tersedia. Silakan buat proyek terlebih dahulu melalui menu pengelolaan proyek.</p>}
            <div className="field">
              <label htmlFor="task-assignees">Penanggung jawab</label>
              <select id="task-assignees" name="assigneeIds" multiple value={draft.assigneeIds} onChange={updateAssignees} disabled={!members.length} aria-describedby="task-assignees-hint">
                {members.map(member => <option key={member.id} value={member.id}>{member.display_name || member.displayName}{member.job_title ? ` — ${member.job_title}` : ''}</option>)}
              </select>
              <small id="task-assignees-hint" className="field__hint">{draft.projectId ? (members.length ? 'Pilih satu atau beberapa anggota proyek.' : 'Proyek ini belum memiliki anggota aktif.') : (members.length ? 'Daftar anggota aktif. Pilih proyek untuk membatasi ke anggota proyek.' : 'Belum ada anggota aktif yang dapat ditugaskan.')}</small>
            </div>
            <div className="task-form-row">
              <Input label="Bobot" name="weight" type="number" min="0.01" step="any" value={draft.weight} onChange={update} required />
              <Select label="Prioritas" name="priority" value={draft.priority} onChange={update}>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </Select>
              <Select label="Status" name="status" value={draft.status} onChange={update}>
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">Review</option>
                <option value="done">Selesai</option>
              </Select>
            </div>
            <ChecklistDraft items={draft.checklist} members={members} onChange={updateChecklist} disabled={false} />
          </div>
          <div className="task-save-notice"><Info size={18} aria-hidden="true" /><p>Perubahan dikirim ke server.</p></div>
          <div className="task-form-actions">
            <Link className="button button--secondary" to="/tasks">Kembali</Link>
            <Button type="submit" disabled={saving || !canSave}>{saving ? 'Menyimpan…' : <><Save size={16} aria-hidden="true" />Simpan tugas</>}</Button>
          </div>
        </form>
      </Panel>
      <ScrollReveal>
        <details className="task-form-help">
          <summary>Panduan</summary>
          <p>Checklist menentukan progres tugas. Pilih proyek terlebih dahulu agar daftar penanggung jawab item checklist terisi dari anggota proyek yang aktif.</p>
        </details>
      </ScrollReveal>
    </div>
  </div>
}
