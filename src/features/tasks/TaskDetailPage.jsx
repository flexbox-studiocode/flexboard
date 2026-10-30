import { useEffect, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, PageHeader, Panel, Textarea, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import TaskChecklistSection from './TaskChecklistSection.jsx'
import TaskMetadata from './TaskMetadata.jsx'
import { addComment, addUpdate, archiveTask, getTask, listComments, listUpdates, updateChecklistItem } from './taskApi.js'
import { toChecklistItem, toCommentItem, toUpdateItem } from '../common/apiAdapters.js'
import './tasks.css'

function listValue(value) { return value?.comments || value?.updates || value?.items || value || [] }
function author(item) { return item.author?.name || item.user?.name || item.authorName || item.author || item.createdBy?.name || 'Anggota tim' }
function time(item) { const value = item.createdAt || item.created_at || item.updatedAt; return value ? new Date(value).toLocaleString('id-ID') : 'Waktu tidak tersedia' }
// The Tenggat is a calendar day (DATE column). Render DD/MM/YYYY without timezone conversion.
function formatDueDate(value) {
  if (!value) return null
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : null
}

/** Builds TaskChecklistSection presentation items from an API task payload. */
function buildChecklistItems(task, profile) {
  if (!Array.isArray(task?.checklist)) return undefined
  return task.checklist.map(raw => {
    const item = toChecklistItem(raw)
    // Managers (leader/admin) may toggle any item in their scope; members only their own assignment.
    const manager = profile?.role === 'leader' || profile?.role === 'admin'
    const owns = Boolean(profile?.id) && item.assigneeId === profile.id
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      completed: item.isCompleted,
      canEdit: Boolean(profile) && (manager || owns),
      assigneeLabel: item.assigneeName || item.assigneeId || null,
    }
  })
}

export default function TaskDetailPage() {
  const { id } = useParams(), navigate = useNavigate(), { profile } = useAuth()
  const [task, setTask] = useState(null), [error, setError] = useState(false), [saving, setSaving] = useState(null)
  const [comments, setComments] = useState(), [updates, setUpdates] = useState(), [comment, setComment] = useState(''), [report, setReport] = useState('')
  const [commentState, setCommentState] = useState({ loading: false, error: null, success: null })
  const [reportState, setReportState] = useState({ loading: false, error: null, success: null })
  const [checklistError, setChecklistError] = useState(null)

  function applyTask(payload) {
    const raw = payload?.task || payload
    setTask(raw)
  }

  useEffect(() => {
    let active = true
    Promise.all([getTask(id), listComments(id).catch(() => undefined), listUpdates(id).catch(() => undefined)])
      .then(([t, c, u]) => {
        if (!active) return
        applyTask(t)
        setComments(c ? (listValue(c) || []).map(toCommentItem) : undefined)
        setUpdates(u ? (listValue(u) || []).map(toUpdateItem) : undefined)
      })
      .catch(() => active && setError(true))
    return () => { active = false }
  }, [id])

  async function toggle(itemId, completed) {
    const previous = task
    // Optimistic-free update: only mutate UI after the server confirms, but mark the item busy.
    setSaving(itemId); setChecklistError(null)
    try {
      const result = await updateChecklistItem(id, itemId, completed)
      const saved = result?.item || result
      if (!saved?.id) throw new Error('INVALID_CHECKLIST_RESPONSE')
      setTask(current => ({
        ...current,
        checklist: (current?.checklist || []).map(item => item.id === itemId
          ? { ...item, is_completed: Boolean(saved.is_completed), completed_by: saved.completed_by, completed_at: saved.completed_at }
          : item),
      }))
    } catch (err) {
      // Revert to the exact previous snapshot so a failed request cannot appear completed.
      setTask(previous)
      setChecklistError(err?.message === 'HTTP_403' ? 'Anda hanya dapat menyelesaikan checklist yang ditugaskan kepada Anda.' : 'Status checklist gagal disimpan.')
    } finally {
      setSaving(null)
    }
  }

  async function submitComment(e) {
    e.preventDefault(); if (!comment.trim()) return
    setCommentState({ loading: true, error: null, success: null })
    try {
      const result = await addComment(id, comment.trim())
      setComments(items => [...(items || []), toCommentItem(result?.comment || result)])
      setComment('')
      setCommentState({ loading: false, error: null, success: 'Komentar tersimpan.' })
    } catch (e) {
      setCommentState({ loading: false, error: e.message === 'HTTP_403' ? 'Anda tidak memiliki akses komentar.' : 'Komentar gagal disimpan.', success: null })
    }
  }

  async function submitReport(e) {
    e.preventDefault(); if (!report.trim()) return
    setReportState({ loading: true, error: null, success: null })
    try {
      const result = await addUpdate(id, report.trim())
      setUpdates(items => [...(items || []), toUpdateItem(result?.update || result)])
      setReport('')
      setReportState({ loading: false, error: null, success: 'Update tersimpan.' })
    } catch (e) {
      setReportState({ loading: false, error: e.message === 'HTTP_403' ? 'Anda tidak memiliki akses laporan.' : 'Update gagal disimpan.', success: null })
    }
  }

  const items = buildChecklistItems(task, profile)
  const progress = typeof task?.progress === 'number' ? task.progress : task?.completion_percent != null ? Number(task.completion_percent) : undefined
  const canReport = Boolean(task && profile)
  const canEdit = Boolean(task && profile && task.status !== 'archived')
  return <div className="feature-page task-detail-page">
    <Link className="feature-back-link" to="/tasks"><ArrowLeft size={16} />Kembali ke Tugas Kami</Link>
    <PageHeader title={task?.title || 'Detail tugas'} description="Satu tugas bersama, progres masing-masing anggota dari checklist tersimpan." actions={<>
      <Button variant="secondary" disabled={!canEdit} onClick={() => navigate(`/tasks/${id}/edit`)}>Edit tugas</Button>
      {profile?.capabilities?.archiveTask && <Button variant="secondary" disabled={!task} onClick={() => archiveTask(id).then(() => navigate('/tasks'))}>Arsipkan tugas</Button>}
    </>} />
    <Panel className="feature-panel task-overview">
      <div className="task-overview__heading"><FileText size={23} /><SectionHeading title="Informasi tugas" description="Metadata tugas." /></div>
      <TaskMetadata projectLabel={task?.project_name || task?.project?.name} assignees={(task?.assignees || []).map(person => ({ id: person.id, name: person.name || person.display_name }))} dueLabel={task?.due_at ? formatDueDate(task.due_at) : task?.due} priorityLabel={task?.priority} statusLabel={task?.status} weightLabel={task?.weight != null ? String(task.weight) : undefined} />
      <section className="task-description"><h2>Deskripsi</h2><p>{task?.description || 'Deskripsi tugas belum tersedia.'}</p></section>
      {error && <UnavailableState title="Detail tugas belum dapat dimuat" description="Layanan tugas gagal diakses." />}
    </Panel>
    <div className="task-detail-layout">
      <div className="stack">
        {checklistError && <Panel><UnavailableState title={checklistError} /></Panel>}
        <TaskChecklistSection items={items} progress={progress} savingItemId={saving} canAdd={false} onItemChange={toggle} />
        <Panel className="task-report-surface" aria-label="Panel laporan pekerjaan">
          <SectionHeading title={task ? 'Laporan pekerjaan' : 'Laporan belum dapat dimuat'} description="Komentar dan update tersimpan di server." />
          <section aria-label="Komentar"><h2>Komentar</h2>
            {comments?.length ? <ul>{comments.map((item, index) => <li key={item.id || index}><strong>{author(item)}</strong> <small>{time(item)}</small><div>{item.body || item.content}</div></li>)}</ul> : comments ? <p>Belum ada komentar.</p> : null}
            <form onSubmit={submitComment}><Textarea label="Komentar" value={comment} onChange={e => setComment(e.target.value)} disabled={!canReport || commentState.loading} rows={3} /><Button type="submit" disabled={!canReport || commentState.loading || !comment.trim()}>{commentState.loading ? 'Menyimpan…' : 'Tambah komentar'}</Button>{commentState.error && <p role="alert">{commentState.error}</p>}{commentState.success && <p role="status">{commentState.success}</p>}</form>
          </section>
          <section aria-label="Update pekerjaan"><h2>Update pekerjaan</h2>
            {updates?.length ? <ul>{updates.map((item, index) => <li key={item.id || index}><strong>{author(item)}</strong> <small>{time(item)}</small><div>{item.body || item.work_summary}</div></li>)}</ul> : updates ? <p>Belum ada update.</p> : null}
            <form onSubmit={submitReport}><Textarea label="Update pekerjaan" value={report} onChange={e => setReport(e.target.value)} disabled={!canReport || reportState.loading} rows={3} /><Button type="submit" disabled={!canReport || reportState.loading || !report.trim()}>{reportState.loading ? 'Menyimpan…' : 'Simpan laporan'}</Button>{reportState.error && <p role="alert">{reportState.error}</p>}{reportState.success && <p role="status">{reportState.success}</p>}</form>
          </section>
        </Panel>
      </div>
    </div>
  </div>
}
