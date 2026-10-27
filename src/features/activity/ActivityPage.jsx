import { History, ShieldCheck } from 'lucide-react'
import { PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import './activity.css'

export default function ActivityPage() {
  return <div className="feature-page activity-page"><PageHeader eyebrow="WORKSPACE HISTORY" title="Aktivitas" description="Telusuri perubahan dan perkembangan pekerjaan dari catatan aktivitas tim." /><Panel className="feature-panel"><FilterToolbar placeholder="Cari aktivitas…" member dates /><div className="feature-results-heading"><h2 className="feature-inline-label"><History size={18} aria-hidden="true" />Riwayat aktivitas</h2><span>DATA BELUM TERSEDIA</span></div><UnavailableState title="Riwayat aktivitas belum dapat dimuat" description="Layanan aktivitas belum terhubung. Tidak ada peristiwa, aktor, atau waktu contoh yang ditampilkan. Riwayat akan mengikuti catatan server dan hak akses akun." /></Panel><aside className="activity-audit-note"><ShieldCheck size={20} aria-hidden="true" /><div><h2>Catatan dari perubahan yang tersimpan</h2><p>Aktivitas hanya ditampilkan setelah server mengonfirmasi perubahan. Input pratinjau dan interaksi filter tidak membuat catatan aktivitas.</p></div></aside></div>
}
