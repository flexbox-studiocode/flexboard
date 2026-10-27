import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, PageHeader, Panel, ProgressBar, UnavailableState } from '../../components/ui/index.js'
import { SectionHeading } from '../common/FeatureUI.jsx'
import ProjectPicker from '../projects/ProjectPicker.jsx'
import './dashboard.css'

export default function DashboardPage() {
  return <div className="feature-page dashboard-page">
    <PageHeader title="Beranda" actions={<Button disabled title="Memerlukan sesi dan izin dari server"><Plus size={18} aria-hidden="true" />Tambah tugas</Button>} />
    <p className="dashboard-intro">Pekerjaan yang sedang berjalan di FlexBox</p>
    <Panel className="dashboard-shared-task" aria-label="Tugas bersama">
      <div className="dashboard-task-heading"><h2>Tugas bersama</h2><span className="dashboard-task-status">Status <strong>Belum tersedia</strong></span></div>
      <UnavailableState title="Tugas belum dapat dimuat" description="Ringkasan tugas, anggota, dan deadline akan tampil setelah layanan terhubung. Ini bukan berarti belum ada tugas." />
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
