import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { requestTaskApi } from '../tasks/taskApi.js'
import { ShieldCheck } from 'lucide-react'
import { Button, PageHeader, Panel } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import CollectionState from '../common/CollectionState.jsx'
import useScopedCollection from '../common/useScopedCollection.js'
import AccountManagementDialog from './AccountManagementDialog.jsx'
import MemberCard from './MemberCard.jsx'
import './members.css'

export default function MembersPage({ members } = {}) {
  const { pathname, search } = useLocation()
  const scope = `${pathname}${search}`
  const [managementPreviewOpen, setManagementPreviewOpen] = useState(false)
  const [apiState, setApiState] = useState({ status: 'loading', scope })
  useEffect(() => {
    if (members !== undefined) return
    let active = true
    requestTaskApi('/members').then(data => {
      if (!Array.isArray(data?.members)) throw new Error('Invalid members response')
      if (active) setApiState({ status: 'success', items: data.members, scope })
    }).catch(() => active && setApiState({ status: 'error', scope }))
    return () => { active = false }
  }, [members])
  const state = useScopedCollection(members !== undefined ? members : apiState)

  return <div className="feature-page members-page">
    <PageHeader title="Anggota" description="Kenali anggota workspace, tanggung jawab, dan perkembangan pekerjaannya." />
    <Panel className="members-panel" aria-labelledby="members-list-title">
      <div className="members-panel__heading"><h2 id="members-list-title">Daftar anggota</h2><Button variant="secondary" onClick={() => setManagementPreviewOpen(true)}>Pratinjau pengelolaan akun</Button></div>
      <FilterToolbar placeholder="Cari nama anggota…" />
      <CollectionState state={state}
        unavailable={{ title: 'Daftar anggota belum dapat dimuat', description: 'Layanan anggota belum terhubung. Ini bukan konfirmasi bahwa workspace tidak memiliki anggota. Akun, peran, dan ringkasan tugas tidak ditampilkan tanpa data server.' }}
        empty={{ title: 'Belum ada anggota', description: 'Tidak ada anggota dalam cakupan yang berhasil dimuat.' }}
        loadingTitle="Memuat daftar anggota"
        errorTitle="Daftar anggota gagal dimuat">
        {items => <div className="feature-stats">{items.map(member => <MemberCard key={member.id} {...member} />)}</div>}
      </CollectionState>
      <div className="members-access-note"><ShieldCheck size={20} aria-hidden="true" /><div><h3>Pengelolaan anggota belum aktif</h3><p>Izin akun belum diverifikasi. Undangan, perubahan peran, dan perubahan status memerlukan layanan backend.</p></div></div>
    </Panel>
    <AccountManagementDialog open={managementPreviewOpen} onClose={() => setManagementPreviewOpen(false)} />
  </div>
}
