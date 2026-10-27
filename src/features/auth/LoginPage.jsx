import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../../components/layout/Brand.jsx'
import Footer from '../../components/layout/Footer.jsx'
import { Badge, Button, Input } from '../../components/ui/index.js'
import logo from '../../assets/brand/flexbox.png'
import './auth.css'

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Masuk | FlexBoard'
    document.querySelector('#login-main')?.focus({ preventScroll: true })
  }, [])
  return <div className="site-frame auth-page"><a href="#login-main" className="skip-link">Lewati ke konten utama</a><header className="site-header"><div className="site-header__inner"><Brand /><Badge tone="info">PRATINJAU UI</Badge></div></header>
    <main className="auth-main" id="login-main" tabIndex={-1}><img className="auth-watermark" src={logo} alt="" /><section className="auth-card" aria-labelledby="login-title"><h1 id="login-title">Masuk ke FlexBoard</h1><p className="muted">Masuk ke workspace tim FlexBox.</p>
      <form className="auth-form" onSubmit={event => event.preventDefault()} aria-describedby="auth-status"><Input label="Identitas akun" autoComplete="username" placeholder="Menunggu ketentuan akun" disabled /><Input label="Password" type="password" autoComplete="current-password" placeholder="Masukkan password" disabled /><Button type="submit" disabled>Masuk belum tersedia</Button></form>
      <p className="auth-help">Akun disediakan oleh Admin.<br />Belum punya akun atau lupa password? Hubungi Admin.</p>
      <div id="auth-status" className="auth-status" role="status"><strong>Autentikasi belum terhubung</strong><p>Kontrak sesi dan layanan login belum tersedia. Penggunaan username atau email menunggu kontrak autentikasi. Tidak ada akun demo, simulasi login, atau kredensial yang dikirim.</p></div>
      <Link to="/" className="auth-preview-link">Lihat pratinjau antarmuka</Link><p className="auth-note">Pratinjau tidak memberikan akses ke data tim.</p>
    </section></main><Footer /></div>
}
