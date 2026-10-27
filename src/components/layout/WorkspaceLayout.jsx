import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, CircleDashed, Menu, Search } from 'lucide-react'
import { Badge, IconButton, Modal } from '../ui/index.js'
import Brand from './Brand.jsx'
import Footer from './Footer.jsx'
import logo from '../../assets/brand/flexbox.png'

const navigation = [['/', 'Beranda'], ['/tasks', 'Tugas Kami'], ['/team-progress', 'Progres Tim'], ['/members', 'Anggota'], ['/activity', 'Aktivitas']]

function Navigation({ onNavigate }) {
  return <nav className="workspace-nav" aria-label="Navigasi utama">{navigation.map(([to, label]) => <NavLink to={to} key={to} end={to === '/'} onClick={onNavigate}>{label}</NavLink>)}</nav>
}

export function WelcomeBanner() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  function search(event) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q').trim()
    navigate(`/tasks${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }
  return <section className="welcome-banner" aria-label="Selamat datang">
    <div className="welcome-banner__brand"><img src={logo} alt="" width="94" height="98" /></div>
    <div className="welcome-banner__title"><span>WORKSPACE FLEXBOX</span><h2>Selamat datang<br />di FlexBoard<span className="welcome-cursor">_</span></h2></div>
    <form className="banner-search" onSubmit={search}><label className="sr-only" htmlFor="workspace-search">Cari tugas berdasarkan judul atau deskripsi</label><input key={params.get('q') || ''} defaultValue={params.get('q') || ''} id="workspace-search" name="q" type="search" placeholder="Cari tugas…" maxLength={200} /><button type="submit" aria-label="Cari tugas"><Search size={27} aria-hidden="true" /></button></form>
  </section>
}

export default function WorkspaceLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const trigger = useRef(null)
  const location = useLocation()
  useEffect(() => {
    const titles = { '/': 'Beranda', '/tasks': 'Tugas Kami', '/team-progress': 'Progres Tim', '/members': 'Anggota', '/activity': 'Aktivitas' }
    document.title = `${titles[location.pathname] || 'Tugas'} | FlexBoard`
    document.querySelector('#workspace-main')?.focus()
  }, [location.pathname])
  const showBanner = ['/', '/tasks', '/team-progress'].includes(location.pathname)
  return <div className="site-frame">
    <a href="#workspace-main" className="skip-link">Lewati ke konten utama</a>
    <header className="site-header"><div className="site-header__inner"><Brand /><div className="desktop-navigation"><Navigation /></div><div className="header-account"><span className="header-account__mark"><CircleDashed size={21} aria-hidden="true" /></span><div><strong>Pratinjau UI</strong><span>Belum masuk</span></div><Link className="account-link" to="/login" aria-label="Buka halaman masuk"><ArrowUpRight size={19} /></Link></div><span ref={trigger} className="mobile-menu-trigger"><IconButton label="Buka menu navigasi" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={23} /></IconButton></span></div></header>
    <Modal open={menuOpen} onClose={() => { setMenuOpen(false); trigger.current?.querySelector('button')?.focus() }} title="Navigasi workspace" className="mobile-navigation"><Navigation onNavigate={() => setMenuOpen(false)} /><Link to="/login" className="button button--secondary" onClick={() => setMenuOpen(false)}>Halaman masuk</Link></Modal>
    <div className="integration-notice"><div><Badge tone="info">PENGEMBANGAN FRONTEND</Badge><p>Pratinjau antarmuka tanpa sesi dan data produksi. Integrasi API belum tersedia.</p><Link to="/login">Status login <ArrowUpRight size={14} aria-hidden="true" /></Link></div></div>
    <main id="workspace-main" className="workspace-main" tabIndex={-1}>{showBanner && <WelcomeBanner />}<Outlet /></main>
    <Footer />
  </div>
}
