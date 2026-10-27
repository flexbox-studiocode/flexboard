import { Plus } from 'lucide-react'
import { Button, PageHeader, Panel } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import CollectionState from '../common/CollectionState.jsx'
import useScopedCollection from '../common/useScopedCollection.js'
import MemberProgressList from './MemberProgressList.jsx'
import './progress.css'

export default function TeamProgressPage({ progress } = {}) {
  const state = useScopedCollection(progress)

  return <div className="feature-page progress-page">
    <PageHeader title="Progres Tim" description="Lihat perkembangan setiap anggota di seluruh tugas." actions={<Button disabled title="Layanan tugas dan izin akun belum tersedia"><Plus size={18} aria-hidden="true" />Tambah tugas</Button>} />
    <Panel className="progress-panel" aria-labelledby="member-progress-title">
      <div className="progress-panel__heading"><h2 id="member-progress-title">Progres per anggota</h2>{state.status === 'unavailable' && <span>Data belum tersedia</span>}</div>
      <FilterToolbar placeholder="Cari anggota…" member />
      <CollectionState state={state}
        unavailable={{ title: 'Progres tim belum dapat dimuat', description: 'Layanan progres belum terhubung. Nama anggota, tugas pembentuk, dan persentase belum dapat ditampilkan. Data yang tidak tersedia tidak ditafsirkan sebagai progres 0%.' }}
        empty={{ title: 'Belum ada progres anggota', description: 'Tidak ada progres anggota dalam cakupan yang berhasil dimuat.' }}
        loadingTitle="Memuat progres tim"
        errorTitle="Progres tim gagal dimuat">
        {items => <MemberProgressList entries={items} />}
      </CollectionState>
      <p className="progress-panel__note">Persentase mengikuti perhitungan server berdasarkan checklist dan bobot tugas. Data yang belum tersedia bukan progres 0%.</p>
    </Panel>
  </div>
}
