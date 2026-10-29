import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Input, PageHeader, Panel, Select, Textarea } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ChecklistDraft from './ChecklistDraft.jsx'
import { createTask, getTask, listMembers, listProjects, updateTask } from './taskApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import './tasks.css'

export default function TaskFormPage() { const { id } = useParams(); return <TaskForm key={id || 'new'} id={id} /> }
function TaskForm({ id }) {
  const editing = Boolean(id), navigate = useNavigate(), { profile } = useAuth()
  const [draft, setDraft] = useState({ title: '', description: '', due: '', weight: '', projectId: '', assigneeIds: [], checklist: [] })
  const [projects, setProjects] = useState([]), [members, setMembers] = useState([]), [loading, setLoading] = useState(editing), [error, setError] = useState(null)
  useEffect(() => { Promise.all([listProjects(), listMembers(), ...(editing ? [getTask(id)] : [])]).then(([p, m, task]) => { setProjects(p?.items || p || []); setMembers(m?.items || m || []); if (task) setDraft({ ...draft, ...task, projectId: task.projectId || '', assigneeIds: task.assigneeIds || [], checklist: task.checklist || [] }); }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [id])
  const update = e => setDraft(d => ({ ...d, [e.target.name]: e.target.value })), invalidWeight = draft.weight !== '' && Number(draft.weight) <= 0
  async function submit(e) { e.preventDefault(); if (invalidWeight) return; await (editing ? updateTask(id, draft) : createTask(draft)); navigate('/tasks') }
  return <div className="feature-page task-form-page"><Link className="feature-back-link" to="/tasks"><ArrowLeft size={16} />Kembali ke Tugas Kami</Link><PageHeader title={editing ? 'Edit tugas' : 'Form tugas baru'} description="Satu tugas bersama, konteks dan arahan yang jelas untuk tim." />{error && <p role="alert">Gagal memuat data.</p>}<Panel className="feature-panel task-form-panel" aria-label="Form informasi tugas"><form onSubmit={submit}><SectionHeading title="Informasi tugas" description="Jelaskan pekerjaan dan konteks yang diperlukan oleh tim." /><Input label="Judul tugas" name="title" value={draft.title} onChange={update} required /><Input label="Tenggat" name="due" type="datetime-local" value={draft.due} onChange={update} /><Textarea label="Deskripsi" name="description" value={draft.description} onChange={update} rows={6} /><Select label="Proyek" name="projectId" value={draft.projectId} onChange={update} disabled={loading}><option value="">Pilih proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}</Select><Select label="Penanggung jawab" name="assigneeIds" multiple value={draft.assigneeIds} onChange={e => setDraft(d => ({ ...d, assigneeIds: [...e.target.selectedOptions].map(o => o.value) }))} disabled={loading}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</Select><Input label="Bobot" name="weight" type="number" step="any" value={draft.weight} onChange={update} error={invalidWeight ? 'Bobot harus lebih besar dari nol.' : undefined} /><ChecklistDraft items={draft.checklist} onChange={checklist => setDraft(d => ({ ...d, checklist }))} disabled={loading} /><div className="task-form-actions"><Link className="button button--secondary" to="/tasks">Kembali</Link><Button type="submit" disabled={loading || invalidWeight || !profile?.capabilities?.createTask}><Save size={16} />Simpan tugas</Button></div></form></Panel></div>
}
