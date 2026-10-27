import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../../components/layout/Brand.jsx'
import Footer from '../../components/layout/Footer.jsx'
import { Badge, Button, Input } from '../../components/ui/index.js'
import logo from '../../assets/brand/flexbox.png'
import './auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    document.title = 'Masuk | FlexBoard'
    document.querySelector('#login-main')?.focus({ preventScroll: true })
  }, [])
  return <div className="site-frame auth-page"><a href="#login-main" className="skip-link">Lewati ke konten utama</a><header className="site-header"><div className="site-header__inner"><Brand /><Badge tone="info">PRATINJAU UI</Badge></div></header>
    <main className="auth-main" id="login-main" tabIndex={-1}><img className="auth-watermark" src={logo} alt="" /><section className="auth-card" aria-labelledby="login-title"><h1 id="login-title">Masuk ke FlexBoard</h1><p className="muted">Masuk ke workspace tim FlexBox.</p>
      <form className="auth-form" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget); const response = await fetch('/api/auth/sign-in/email', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) }); setBusy(false); if (!response.ok) { setError('Email atau password tidak valid.'); return } navigate('/') }} aria-describedby="auth-status"><Input label="Email" name="email" type="email" autoComplete="username" required /><Input label="Password" name="password" type="password" autoComplete="current-password" required /><Button type="submit" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</Button></form>
      <p className="auth-help">Akun disediakan oleh Admin.<br />Belum punya akun atau lupa password? Hubungi Admin.</p>
      <div id="auth-status" className="auth-status" role="status">{error ? <><strong>Gagal masuk</strong><p>{error}</p></> : <><strong>Autentikasi tersedia</strong><p>Gunakan akun yang disediakan Admin.</p></>}</div>
      <Link to="/" className="auth-preview-link">Lihat pratinjau antarmuka</Link><p className="auth-note">Pratinjau tidak memberikan akses ke data tim.</p>
    </section></main><Footer /></div>
}
