import { ArrowLeft, CircleHelp, FileText, LockKeyhole } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { DataNotice, SectionHeading } from '../common/FeatureUI.jsx'
import ActivityList from '../activity/ActivityList.jsx'
import TaskChecklistSection from './TaskChecklistSection.jsx'
import TaskMetadata from './TaskMetadata.jsx'
import './tasks.css'

export default function TaskDetailPage() {
  const { id } = useParams()
  return <div className="feature-page task-detail-page">
    <Link className="feature-back-link" to="/tasks"><ArrowLeft size={16} aria-hidden="true" />Kembali ke Tugas Kami</Link>
    <PageHeader title="Detail tugas" description="Satu tugas bersama, progres masing-masing anggota dari checklist tersimpan." actions={<><Button variant="secondary" disabled>Edit tugas</Button><Button variant="secondary" disabled>Arsipkan tugas</Button></>} />
    <Panel className="feature-panel task-overview">
      <div className="task-overview__heading"><FileText size={23} aria-hidden="true" /><SectionHeading title="Informasi tugas" description="Metadata ditampilkan setelah tugas dan akses berhasil diverifikasi." /></div>
      <TaskMetadata />
      <section className="task-description" aria-labelledby="task-description-title"><h2 id="task-description-title">Deskripsi</h2><p className="muted">Deskripsi tugas belum tersedia.</p></section>
      <UnavailableState title="Detail tugas belum dapat dimuat" description="Layanan tugas belum terhubung. Keberadaan tugas dan hak akses akun belum dapat diverifikasi; judul dan nilai metadata tidak dikarang." />
      <div className="task-reference"><CircleHelp size={16} aria-hidden="true" /><p>Referensi URL: <code>{id}</code>. Referensi ini belum dikonfirmasi sebagai tugas yang dapat diakses.</p></div>
    </Panel>
    <div className="task-detail-layout">
      <div className="stack">
        <TaskChecklistSection />
        <Panel className="feature-panel task-update-panel" aria-labelledby="task-report-title">
          <div className="task-members__heading"><h2 id="task-report-title">Laporan pekerjaan &amp; kendala</h2><p>Data anggota menunggu verifikasi akses.</p></div>
          <div className="task-report-surface" aria-label="Panel laporan pekerjaan">
            <SectionHeading title="Tulis / update laporan" description="Apa yang sudah dikerjakan? Ada kendala?" />
            <UnavailableState title="Laporan belum dapat dimuat" description="Tidak ada laporan yang ditampilkan atau dikirim. Form laporan menunggu keputusan produk, tugas terverifikasi, dan layanan penyimpanan." />
            <p className="task-update-panel__note"><LockKeyhole size={16} aria-hidden="true" />Tidak ada input persentase manual atau upload. Progres bersumber dari checklist yang tersimpan di server.</p>
            <div className="task-report-actions"><Button disabled>Simpan laporan</Button></div>
          </div>
        </Panel>
      </div>
      <aside className="stack">
        <DataNotice title="Perubahan harus tersimpan">Checklist hanya diperbarui setelah server memvalidasi akses dan menyimpan perubahan. Progres tidak diisi manual.</DataNotice>
        <Panel className="feature-panel"><SectionHeading eyebrow="TASK HISTORY" title="Riwayat tugas" description="Aktor, tindakan, objek terkait, dan waktu berasal dari catatan server." /><ActivityList /></Panel>
      </aside>
    </div>
  </div>
}
