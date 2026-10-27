import { ArrowUpRight, LayoutList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel, UnavailableState } from '../../components/ui/index.js'
import { FilterToolbar } from '../common/FeatureUI.jsx'
import './tasks.css'

export default function TasksPage() {
  return <div className="feature-page tasks-page"><PageHeader eyebrow="TEAM WORKSPACE" title="Tugas Kami" description="Temukan tugas, lihat prioritas, dan ikuti perkembangan pekerjaan tim." actions={<Link className="button button--secondary" to="/tasks/new">Pratinjau form tugas<ArrowUpRight size={16} aria-hidden="true" /></Link>} /><Panel className="feature-panel"><FilterToolbar placeholder="Cari judul atau deskripsi tugas…" member dates taskFilters /><div className="feature-results-heading"><h2 className="feature-inline-label"><LayoutList size={18} aria-hidden="true" />Daftar tugas</h2><span>DATA BELUM TERSEDIA</span></div><UnavailableState title="Daftar tugas belum dapat dimuat" description="Layanan tugas belum terhubung. Ini bukan hasil pencarian kosong. Tugas akan ditampilkan sesuai akses akun setelah server tersedia." /></Panel></div>
}
