import { CheckCheck, ClipboardList, Clock3, FolderKanban } from 'lucide-react'
import { PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { DataNotice, MetricCard, SectionHeading } from '../common/FeatureUI.jsx'
import './dashboard.css'

export default function DashboardPage() {
  return <div className="feature-page dashboard-page">
    <PageHeader eyebrow="WORKSPACE OVERVIEW" title="Beranda" description="Ruang untuk melihat pekerjaan, prioritas, dan perkembangan tim." />
    <section className="feature-stats" aria-label="Ringkasan workspace">
      <MetricCard label="Tugas aktif" icon={ClipboardList} />
      <MetricCard label="Tugas selesai" icon={CheckCheck} tone="green" />
      <MetricCard label="Melewati tenggat" icon={Clock3} tone="amber" />
      <MetricCard label="Proyek aktif" icon={FolderKanban} tone="purple" />
    </section>
    <div className="feature-two-columns">
      <Panel className="feature-panel dashboard-projects"><SectionHeading eyebrow="PROJECT OVERVIEW" title="Progres proyek" description="Perkembangan pekerjaan dari tugas dalam setiap proyek." /><UnavailableState title="Progres proyek belum tersedia" description="Layanan proyek belum terhubung. Persentase dan daftar proyek akan ditampilkan setelah data server tersedia." /></Panel>
      <Panel className="feature-panel"><SectionHeading eyebrow="UP NEXT" title="Mendekati tenggat" to="/tasks" linkLabel="Lihat tugas" /><UnavailableState title="Tenggat belum dapat dimuat" description="Daftar tugas mendatang memerlukan data tugas dan aturan zona waktu dari server." /></Panel>
    </div>
    <div className="feature-two-columns dashboard-bottom-grid">
      <Panel className="feature-panel"><SectionHeading eyebrow="WORKSPACE UPDATES" title="Aktivitas terbaru" to="/activity" linkLabel="Semua aktivitas" /><UnavailableState title="Aktivitas belum tersedia" description="Riwayat akan berasal dari perubahan yang benar-benar tersimpan di server, bukan aktivitas contoh." /></Panel>
      <DataNotice title="Satu gambaran, data yang dapat dipercaya">Ringkasan akan mengikuti akses akun dan data terbaru dari server. Tanda — berarti data belum tersedia, bukan jumlah tugas nol.</DataNotice>
    </div>
  </div>
}
