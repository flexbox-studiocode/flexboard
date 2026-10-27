import { useState } from 'react'
import { ShieldCheck, UserCheck, Users } from 'lucide-react'
import { Button, PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { DataNotice, FilterToolbar, MetricCard } from '../common/FeatureUI.jsx'
import AccountManagementDialog from './AccountManagementDialog.jsx'
import './members.css'

export default function MembersPage() {
  const [managementPreviewOpen, setManagementPreviewOpen] = useState(false)

  return <div className="feature-page members-page"><PageHeader eyebrow="THE PEOPLE BEHIND THE WORK" title="Anggota" description="Kenali anggota workspace, tanggung jawab, dan perkembangan pekerjaannya." /><div className="members-summary"><MetricCard label="Anggota workspace" icon={Users} /><MetricCard label="Akun aktif" icon={UserCheck} tone="green" /><DataNotice title="Akses sesuai peran">Nama, peran, dan status akun akan berasal dari server. Pengelolaan anggota memerlukan izin yang terverifikasi.</DataNotice></div><Panel className="feature-panel"><FilterToolbar placeholder="Cari nama anggota…" /><div className="feature-results-heading"><h2>Daftar anggota</h2><span>DATA BELUM TERSEDIA</span></div><UnavailableState title="Daftar anggota belum dapat dimuat" description="Layanan anggota belum terhubung. Ini bukan konfirmasi bahwa workspace tidak memiliki anggota. Akun, peran, dan ringkasan tugas tidak ditampilkan tanpa data server." /></Panel><div className="members-access-note"><ShieldCheck size={20} aria-hidden="true" /><div><h2>Pengelolaan anggota belum aktif</h2><p>Izin akun belum diverifikasi. Undangan, perubahan peran, dan perubahan status memerlukan layanan backend.</p></div><Button variant="secondary" onClick={() => setManagementPreviewOpen(true)}>Pratinjau pengelolaan akun</Button></div><AccountManagementDialog open={managementPreviewOpen} onClose={() => setManagementPreviewOpen(false)} /></div>
}
