import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { requestTaskApi } from '../tasks/taskApi.js'
import { PageHeader, Panel } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import CollectionState from '../common/CollectionState.jsx'
import useScopedCollection from '../common/useScopedCollection.js'
import ActivityList from './ActivityList.jsx'
import { toActivityEntry } from '../common/apiAdapters.js'
import './activity.css'

export default function ActivityPage({ activity } = {}) {
  const [apiState, setApiState] = useState({ status: 'idle' })
  useEffect(() => {
    if (activity !== undefined) return
    let active = true
    requestTaskApi('/activity').then(data => active && setApiState({ status: 'success', items: (data?.activity || data?.items || []).map(toActivityEntry) })).catch(() => active && setApiState({ status: 'error' }))
    return () => { active = false }
  }, [activity])
  const state = useScopedCollection(activity !== undefined ? activity : apiState)

  return <div className="feature-page activity-page">
    <PageHeader title="Aktivitas" description="Laporan terakhir yang ditulis anggota pada setiap tugas." />
    <Panel className="activity-panel" aria-labelledby="work-updates-title">
      <h2 id="work-updates-title">Update pekerjaan</h2>
      <FilterToolbar placeholder="Cari aktivitas…" member dates />
      <CollectionState state={state}
        unavailable={{ title: 'Riwayat belum tersedia', description: 'Layanan aktivitas belum terhubung. Aktivitas akan ditampilkan setelah catatan server berhasil dimuat sesuai akses. Tidak ada peristiwa, aktor, atau waktu contoh yang ditampilkan.' }}
        empty={{ title: 'Belum ada aktivitas', description: 'Belum ada catatan aktivitas dalam cakupan yang dimuat.' }}
        loadingTitle="Memuat aktivitas"
        errorTitle="Aktivitas gagal dimuat">
        {items => <ActivityList entries={items} />}
      </CollectionState>
      <aside className="activity-audit-note"><ShieldCheck size={20} aria-hidden="true" /><div><h3>Catatan dari perubahan yang tersimpan</h3><p>Aktivitas hanya ditampilkan setelah server mengonfirmasi perubahan. Input pratinjau dan interaksi filter tidak membuat catatan aktivitas.</p></div></aside>
    </Panel>
  </div>
}
