import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CircleDashed, Menu } from 'lucide-react'
import { IconButton, Modal } from '../ui/index.js'
import Brand from './Brand.jsx'
import Footer from './Footer.jsx'
import ProfileDialog from '../../features/members/ProfileDialog.jsx'
import logo from '../../assets/brand/flexbox.png'
import searchIcon from '../../assets/brand/banner-search.svg'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import settleMotion from '../ui/settleMotion.js'
import useEntryMotion from '../ui/useEntryMotion.js'

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
    <div className="welcome-banner__title"><h2>Selamat Datang<br />di FlexBoard<span className="welcome-cursor">_</span></h2></div>
    <form className="banner-search" onSubmit={search}><label className="sr-only" htmlFor="workspace-search">Cari tugas berdasarkan judul atau deskripsi</label><input key={params.get('q') || ''} defaultValue={params.get('q') || ''} id="workspace-search" name="q" type="search" placeholder="Cari tugas…" maxLength={200} /><button type="submit" aria-label="Cari tugas"><img src={searchIcon} alt="" width="49" height="49" /></button></form>
  </section>
}

export default function WorkspaceLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const auth = useAuth()
  const trigger = useRef(null)
  const location = useLocation()
  const entry = useRef(null)
  useEntryMotion(entry)
  useEffect(() => {
    const titles = { '/': 'Beranda', '/tasks': 'Tugas Kami', '/tasks/new': 'Form tugas baru', '/team-progress': 'Progres Tim', '/members': 'Anggota', '/activity': 'Aktivitas' }
    const taskTitle = /^\/tasks\/[^/]+\/edit$/.test(location.pathname) ? 'Edit tugas' : /^\/tasks\/[^/]+$/.test(location.pathname) ? 'Detail tugas' : 'Halaman tidak ditemukan'
    document.title = `${titles[location.pathname] || taskTitle} | FlexBoard`
    document.querySelector('#workspace-main')?.focus({ preventScroll: true })
  }, [location.pathname])
  const showBanner = ['/', '/tasks', '/tasks/new', '/team-progress'].includes(location.pathname)
  return <div className="site-frame">
    <a href="#workspace-main" className="skip-link">Lewati ke konten utama</a>
    <header className="site-header"><div className="site-header__inner"><Brand /><div className="desktop-navigation"><Navigation /></div><div className="header-account"><span className="header-account__mark"><CircleDashed size={21} aria-hidden="true" /></span><div><strong>{auth.status === 'authenticated' ? auth.profile.displayName || auth.profile.email : auth.status === 'loading' ? 'Memeriksa sesi…' : auth.status === 'unavailable' ? 'Layanan tidak tersedia' : 'Pratinjau UI'}</strong><span>{auth.status === 'authenticated' ? auth.profile.role : auth.status === 'anonymous' ? 'Belum masuk' : 'Status sesi belum tersedia'}</span></div><IconButton label="Buka profil akun" aria-haspopup="dialog" aria-expanded={profileOpen} onClick={() => setProfileOpen(true)}><CircleDashed size={21} aria-hidden="true" /></IconButton></div><span ref={trigger} className="mobile-menu-trigger"><IconButton label="Buka menu navigasi" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={23} /></IconButton></span></div></header>
    <Modal open={menuOpen} onClose={() => { setMenuOpen(false); trigger.current?.querySelector('button')?.focus() }} title="Navigasi workspace" className="mobile-navigation"><Navigation onNavigate={() => setMenuOpen(false)} /><Link to="/login" className="button button--secondary" onClick={() => setMenuOpen(false)}>Halaman masuk</Link></Modal>
    <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} auth={auth} />
    <main id="workspace-main" className="workspace-main" tabIndex={-1}>{showBanner && <WelcomeBanner />}<div className="motion-route" ref={entry} data-motion-entry key={location.pathname} onFocusCapture={settleMotion} onAnimationEnd={settleMotion}><Outlet /></div></main>
    <aside className="integration-notice" aria-label="Status sesi"><div><p>{auth.status === 'authenticated' ? `Sesi aktif sebagai ${auth.profile.role}.` : auth.status === 'unavailable' ? 'Layanan autentikasi tidak tersedia.' : 'Belum ada sesi aktif.'}</p><Link to={auth.status === 'authenticated' ? '/' : '/login'}>{auth.status === 'authenticated' ? 'Workspace' : 'Masuk'}</Link></div></aside>
    <Footer />
  </div>
}
