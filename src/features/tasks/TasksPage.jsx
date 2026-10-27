import { LayoutList, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel, ProgressBar, UnavailableState } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import './tasks.css'

export default function TasksPage() {
  return <div className="feature-page tasks-page">
    <PageHeader title="Tugas Kami" description="Satu ruang tugas bersama, perkembangan pekerjaan masing-masing anggota." actions={<Link className="button" to="/tasks/new"><Plus size={18} aria-hidden="true" />Tambah tugas<span className="sr-only"> — pratinjau form tugas</span></Link>} />
    <Panel className="feature-panel task-filters" aria-label="Pencarian dan filter tugas">
      <FilterToolbar placeholder="Cari judul atau deskripsi tugas…" member dates taskFilters />
    </Panel>
    <section className="task-workspace" aria-labelledby="task-list-title">
      <h2 className="task-workspace__label" id="task-list-title"><LayoutList size={16} aria-hidden="true" />Daftar tugas</h2>
      <Panel className="feature-panel task-summary" aria-label="Ringkasan tugas">
        <div className="task-summary__heading"><span>TUGAS BERSAMA</span><span>Tenggat belum tersedia</span></div>
        <UnavailableState title="Daftar tugas belum dapat dimuat" description="Layanan tugas belum terhubung. Ini bukan hasil pencarian kosong. Tugas akan ditampilkan sesuai akses akun setelah server tersedia." />
        <ProgressBar label="Progres tim" unavailableLabel="Belum tersedia" />
      </Panel>
      <Panel className="feature-panel task-members" aria-labelledby="task-members-title">
        <div className="task-members__heading"><h2 id="task-members-title">Progres anggota</h2><p>Progres bersumber dari checklist tersimpan.</p></div>
        <UnavailableState title="Progres anggota belum tersedia" description="Anggota, laporan pekerjaan, dan progres akan ditampilkan setelah tugas serta akses akun terverifikasi. Tidak ada nama atau persentase contoh." />
      </Panel>
    </section>
  </div>
}
