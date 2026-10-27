import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button, PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import AccountManagementDialog from './AccountManagementDialog.jsx'
import './members.css'

export default function MembersPage() {
  const [managementPreviewOpen, setManagementPreviewOpen] = useState(false)

  return <div className="feature-page members-page">
    <PageHeader title="Anggota" description="Kenali anggota workspace, tanggung jawab, dan perkembangan pekerjaannya." />
    <Panel className="members-panel" aria-labelledby="members-list-title">
      <div className="members-panel__heading"><h2 id="members-list-title">Daftar anggota</h2><Button variant="secondary" onClick={() => setManagementPreviewOpen(true)}>Pratinjau pengelolaan akun</Button></div>
      <FilterToolbar placeholder="Cari nama anggota…" />
      <UnavailableState title="Daftar anggota belum dapat dimuat" description="Layanan anggota belum terhubung. Ini bukan konfirmasi bahwa workspace tidak memiliki anggota. Akun, peran, dan ringkasan tugas tidak ditampilkan tanpa data server." />
      <div className="members-access-note"><ShieldCheck size={20} aria-hidden="true" /><div><h3>Pengelolaan anggota belum aktif</h3><p>Izin akun belum diverifikasi. Undangan, perubahan peran, dan perubahan status memerlukan layanan backend.</p></div></div>
    </Panel>
    <AccountManagementDialog open={managementPreviewOpen} onClose={() => setManagementPreviewOpen(false)} />
  </div>
}
