import { useState } from 'react'
import { ArrowLeft, Info, Save } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, Input, PageHeader, Panel, Select, Textarea, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ChecklistDraft from './ChecklistDraft.jsx'
import './tasks.css'

export default function TaskFormPage() {
  const { id } = useParams()
  // Reset form state when a different route reference is opened.
  return <TaskForm key={id ? `edit:${id}` : 'new'} editing={Boolean(id)} />
}

function TaskForm({ editing }) {
  const [draft, setDraft] = useState({ title: '', description: '', due: '', weight: '', checklist: [] })
  function update(event) {
    const { name, value } = event.target
    setDraft(previous => ({ ...previous, [name]: value }))
  }
  const updateChecklist = checklist => setDraft(previous => ({ ...previous, checklist }))
  const invalidWeight = draft.weight !== '' && (!Number.isFinite(Number(draft.weight)) || Number(draft.weight) <= 0)

  return <div className="feature-page task-form-page">
    <Link className="feature-back-link" to="/tasks"><ArrowLeft size={16} aria-hidden="true" />Kembali ke Tugas Kami</Link>
    <PageHeader title={editing ? 'Edit tugas' : 'Form tugas baru'} description="Satu tugas bersama, konteks dan arahan yang jelas untuk tim. Form ini masih pratinjau lokal." />
    {editing && <Panel className="feature-panel"><UnavailableState title="Data tugas belum dapat dimuat" description="Nilai tugas saat ini dan hak edit belum dapat diverifikasi. Formulir di bawah tidak mewakili data tersimpan." /></Panel>}
    <div className="task-form-layout">
      <Panel className="feature-panel task-form-panel" aria-label="Form informasi tugas">
        <form onSubmit={event => event.preventDefault()} aria-describedby="task-save-notice">
          <SectionHeading title="Informasi tugas" description="Jelaskan pekerjaan dan konteks yang diperlukan oleh tim." />
          <div className="task-form-fields">
            <div className="task-form-hero-row">
              <Input className="task-form-title" label="Judul tugas" name="title" value={draft.title} onChange={update} placeholder="Tuliskan judul tugas" autoComplete="off" disabled={editing} />
              <Input label="Tenggat" name="due" type="datetime-local" value={draft.due} onChange={update} disabled={editing} hint="Zona waktu dan aturan tenggat mengikuti kontrak server." />
            </div>
            <Textarea className="task-form-description" label="Deskripsi" name="description" value={draft.description} onChange={update} placeholder="Jelaskan tujuan, ruang lingkup, dan hasil yang diharapkan" rows={6} disabled={editing} hint="Arahan untuk tim. Progres tidak diisi manual; progres mengikuti checklist tersimpan." />
            <Select label="Proyek" value="" disabled hint="Daftar proyek memerlukan layanan dan hak akses."><option value="">Pilihan proyek belum tersedia</option></Select>
            <Select label="Penanggung jawab" value={[]} multiple disabled hint="Satu atau beberapa anggota dapat dipilih setelah data tersedia."><option value="" disabled>Daftar anggota belum tersedia</option></Select>
            <div className="task-form-row">
              <Input label="Bobot" name="weight" type="number" step="any" value={draft.weight} onChange={update} disabled={editing} placeholder="Belum ditetapkan" error={invalidWeight ? 'Bobot harus lebih besar dari nol.' : undefined} hint="Tidak ada bobot bawaan. Nilai harus lebih besar dari nol." />
            </div>
            <div className="task-form-row">
              <Select label="Prioritas" value="" disabled><option value="">Pilihan belum dikonfirmasi</option></Select>
              <Select label="Status" value="" disabled><option value="">Pilihan belum dikonfirmasi</option></Select>
            </div>
            <ChecklistDraft items={draft.checklist} onChange={updateChecklist} disabled={editing} />
          </div>
          <div className="task-save-notice" id="task-save-notice"><Info size={18} aria-hidden="true" /><p>Belum dapat disimpan. Layanan tugas, pilihan prioritas/status, serta izin pengguna belum terhubung. Input pratinjau hanya berada di halaman ini dan tidak dikirim atau disimpan.</p></div>
          <div className="task-form-actions"><Link className="button button--secondary" to="/tasks">Kembali</Link><Button type="submit" disabled><Save size={16} aria-hidden="true" />Simpan tugas</Button></div>
        </form>
      </Panel>
      <details className="task-form-help">
        <summary>Tentang pratinjau ini</summary>
        <ul className="task-form-guidance"><li>Belum ada tugas atau perubahan yang dibuat.</li><li>Daftar proyek dan anggota mengikuti akses dari server.</li><li>Aturan status, prioritas, bobot, dan review perlu dikonfirmasi.</li><li>Izin membuat atau mengedit akan diverifikasi oleh backend.</li></ul>
      </details>
    </div>
  </div>
}
