import { LayoutList, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel, ProgressBar } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import CollectionState from '../common/CollectionState.jsx'
import useScopedCollection from '../common/useScopedCollection.js'
import TaskCard from './TaskCard.jsx'
import MemberProgressList from '../progress/MemberProgressList.jsx'
import './tasks.css'

// Supplied resources are internal UI props; routes deliberately supply none until API integration.
export default function TasksPage({ tasks, members }) {
  const taskState = useScopedCollection(tasks)
  const memberState = useScopedCollection(members)
  return <div className="feature-page tasks-page">
    <PageHeader title="Tugas Kami" description="Satu ruang tugas bersama, perkembangan pekerjaan masing-masing anggota." actions={<Link className="button" to="/tasks/new"><Plus size={20} strokeWidth={1.5} aria-hidden="true" />Tambah tugas<span className="sr-only"> — pratinjau form tugas</span></Link>} />
    <Panel className="feature-panel task-filters" aria-label="Pencarian dan filter tugas">
      <FilterToolbar placeholder="Cari judul atau deskripsi tugas…" member dates taskFilters />
    </Panel>
    <section className="task-workspace" aria-labelledby="task-list-title">
      <h2 className="task-workspace__label" id="task-list-title"><LayoutList size={16} aria-hidden="true" />Daftar tugas</h2>
      <Panel className="feature-panel task-summary" aria-label="Ringkasan tugas">
        <div className="task-summary__heading"><span>TUGAS BERSAMA</span><span>Tenggat belum tersedia</span></div>
        <CollectionState state={taskState}
          unavailable={{ title: 'Daftar tugas belum dapat dimuat', description: 'Layanan tugas belum terhubung. Ini bukan hasil pencarian kosong. Tugas akan ditampilkan sesuai akses akun setelah server tersedia.' }}
          empty={{ title: 'Tidak ada tugas dalam hasil ini', description: 'Daftar tugas berhasil dimuat tanpa item dalam cakupan ini.' }}
          loadingTitle="Memuat daftar tugas…" errorTitle="Daftar tugas gagal dimuat">
          {items => <div className="stack">{items.map(item => <TaskCard key={item.id} {...item} />)}</div>}
        </CollectionState>
        <ProgressBar label="Progres tim" unavailableLabel="Belum tersedia" />
      </Panel>
      <Panel className="feature-panel task-members" aria-labelledby="task-members-title">
        <div className="task-members__heading"><h2 id="task-members-title">Progres anggota</h2><p>Progres bersumber dari checklist tersimpan.</p></div>
        <CollectionState state={memberState}
          unavailable={{ title: 'Progres anggota belum tersedia', description: 'Anggota, laporan pekerjaan, dan progres akan ditampilkan setelah tugas serta akses akun terverifikasi. Tidak ada nama atau persentase contoh.' }}
          empty={{ title: 'Belum ada progres anggota', description: 'Tidak ada progres anggota dalam cakupan yang berhasil dimuat.' }}
          loadingTitle="Memuat progres anggota…" errorTitle="Progres anggota gagal dimuat">
          {items => <MemberProgressList entries={items} />}
        </CollectionState>
      </Panel>
    </section>
  </div>
}
