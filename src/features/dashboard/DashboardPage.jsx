import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { listTasks } from '../tasks/taskApi.js'
import { useEffect, useState } from 'react'
import { PageHeader, Panel, ProgressBar, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ProjectPicker from '../projects/ProjectPicker.jsx'
import './dashboard.css'

export default function DashboardPage() {
  const { profile } = useAuth(); const [tasks, setTasks] = useState(null)
  useEffect(() => { listTasks().then(data => setTasks(data?.tasks || [])).catch(() => setTasks([])) }, [])
  const canCreate = profile?.capabilities?.createTask === true
  return <div className="feature-page dashboard-page">
    <PageHeader title="Beranda" actions={canCreate ? <Link className="button" to="/tasks/new"><Plus size={18} aria-hidden="true" />Tambah tugas</Link> : null} />
    <p className="dashboard-intro">Pekerjaan yang sedang berjalan di FlexBox</p>
    <Panel className="dashboard-shared-task" aria-label="Tugas bersama">
      <div className="dashboard-task-heading"><h2>Tugas bersama</h2><span className="dashboard-task-status">Status <strong>Belum tersedia</strong></span></div>
      {tasks === null ? <UnavailableState title="Memuat tugas" /> : tasks.length ? <p>{tasks.length} tugas aktif tersimpan.</p> : <UnavailableState title="Belum ada tugas" description="Tidak ada tugas aktif pada cakupan Anda." />}
      <div className="dashboard-task-footer"><ProgressBar value={null} label="Akumulasi progres" unavailableLabel="Belum tersedia" /><Link className="button button--secondary" to="/tasks">Lihat tugas</Link></div>
    </Panel>
    <Panel className="dashboard-team" aria-label="Tim FlexBox">
      <SectionHeading title="Tim FlexBox" to="/members" linkLabel="Lihat anggota" />
      <p className="dashboard-team-unavailable">Daftar anggota belum tersedia. Nama, peran, dan jumlah anggota akan mengikuti data server.</p>
      <p className="dashboard-team-caption">Leader mengatur tugas. Anggota mengerjakan checklist sesuai izin.</p>
    </Panel>
    <section className="dashboard-activity" aria-label="Ringkasan aktivitas">
      <SectionHeading title="Aktivitas terbaru" to="/activity" linkLabel="Semua aktivitas" />
      <Panel><UnavailableState title="Aktivitas belum tersedia" description="Perubahan pekerjaan yang tersimpan di server akan ditampilkan di sini. Laporan pekerjaan tersedia melalui detail tugas setelah cakupannya disepakati." /></Panel>
    </section>
    <section className="dashboard-project-tools" aria-label="Pratinjau pengelolaan proyek"><h2>Pratinjau pengelolaan proyek</h2><ProjectPicker /></section>
  </div>
}
