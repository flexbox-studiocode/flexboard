import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../../components/layout/Brand.jsx'
import Footer from '../../components/layout/Footer.jsx'
import { Badge, Button, Input } from '../../components/ui/index.js'
import logo from '../../assets/brand/flexbox.png'
import './auth.css'
import { useAuth } from './AuthContext.jsx'
import settleMotion from '../../components/ui/settleMotion.js'
import useEntryMotion from '../../components/ui/useEntryMotion.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [error, setError] = useState('')
  const [diagnostic, setDiagnostic] = useState('')
  const [busy, setBusy] = useState(false)
  const entry = useRef(null)
  useEntryMotion(entry)
  useEffect(() => { document.title = 'Masuk | FlexBoard'; document.querySelector('#login-main')?.focus({ preventScroll: true }) }, [])
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setDiagnostic('')
    const form = new FormData(event.currentTarget)
    const safeError = async (response) => {
      try {
        const body = await response.json()
        return typeof body?.error?.code === 'string' ? body.error.code : 'HTTP_ERROR'
      } catch { return 'HTTP_ERROR' }
    }
    try {
      const response = await fetch('/api/auth/sign-in/email', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })
      if (!response.ok) {
        const code = await safeError(response)
        setDiagnostic(import.meta.env.DEV ? `HTTP ${response.status} · ${code}` : '')
        if (!response.status || response.status === 401 || response.status === 403) setError('Email atau password tidak valid.')
        else if (response.status === 400) setError('Permintaan login ditolak. Periksa asal aplikasi lalu coba lagi.')
        else setError('Layanan login sedang bermasalah. Coba lagi nanti.')
        return
      }
      const session = await fetch('/api/auth/me', { credentials: 'include' })
      let profile
      try { profile = (await session.json())?.data?.user } catch { profile = null }
      if (!session.ok || !profile?.id || !profile?.role) {
        setDiagnostic(import.meta.env.DEV ? `HTTP ${session.status} · SESSION_INVALID` : '')
        setError('Sesi tidak dapat diverifikasi.')
        return
      }
      await refresh()
      navigate('/', { replace: true })
    } catch { setDiagnostic(import.meta.env.DEV ? 'NETWORK_ERROR' : ''); setError('Login tidak dapat diproses. Periksa koneksi lalu coba lagi.')
    } finally { setBusy(false) }
  }
  return <div className="site-frame auth-page"><a href="#login-main" className="skip-link">Lewati ke konten utama</a><header className="site-header"><div className="site-header__inner"><Brand /><Badge tone="info">AUTENTIKASI AKTIF</Badge></div></header>
    <main className="auth-main" id="login-main" ref={entry} data-motion-entry tabIndex={-1} onFocusCapture={settleMotion} onAnimationEnd={settleMotion}><img className="auth-watermark" src={logo} alt="" /><section className="auth-card" aria-labelledby="login-title"><h1 id="login-title">Masuk ke FlexBoard</h1><p className="muted">Masuk ke workspace tim FlexBox.</p>
      <form className="auth-form" onSubmit={submit} aria-describedby="auth-status"><Input label="Email" name="email" type="email" autoComplete="username" required /><Input label="Password" name="password" type="password" autoComplete="current-password" required /><Button type="submit" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</Button></form>
      <p className="auth-help">Akun disediakan oleh Admin.<br />Belum punya akun atau lupa password? Hubungi Admin.</p><div id="auth-status" className="auth-status" role="status">{error ? <><strong>Gagal masuk</strong><p>{error}</p>{diagnostic && <small>{diagnostic}</small>}</> : <><strong>Autentikasi tersedia</strong><p>Gunakan akun yang disediakan Admin.</p></>}</div><Link to="/" className="auth-preview-link">Kembali</Link></section></main><Footer /></div>
}
