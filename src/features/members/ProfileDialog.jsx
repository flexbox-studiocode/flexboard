import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Modal, UnavailableState } from '../../components/ui/index.js'
import './profile.css'

export default function ProfileDialog({ open, onClose, auth }) {
  const profile = auth?.profile
  return <Modal open={open} onClose={onClose} title="Profil akun" className="profile-dialog">
    {auth?.status !== 'authenticated' && <UnavailableState title={auth?.status === 'unavailable' ? 'Sesi tidak tersedia' : 'Belum masuk'} description={auth?.status === 'unavailable' ? 'Layanan autentikasi tidak tersedia. Coba lagi nanti.' : 'Tidak ada sesi tervalidasi.'} />}
    <dl className="profile-details">
      <div><dt>Nama tampilan</dt><dd>{profile?.displayName || profile?.email || '—'}</dd></div>
      <div><dt>Role akses</dt><dd>{profile?.role || '—'}</dd></div>
      <div><dt>Status akun</dt><dd>{profile ? 'Aktif' : '—'}</dd></div>
      <div><dt>Tugas aktif</dt><dd>—</dd></div>
      <div><dt>Progres pribadi</dt><dd>—</dd></div>
    </dl>
    <p className="profile-disclosure" id="profile-permissions"><LockKeyhole size={16} aria-hidden="true" />Perubahan profil, role, status, dan logout memerlukan sesi serta izin server. Tidak ada akun aktif pada pratinjau ini.</p>
    <div className="profile-actions" aria-describedby="profile-permissions">
      <Button variant="secondary" disabled>Ubah profil</Button>
      <Button variant="secondary" disabled>Kelola role/status</Button>
      <Button variant="secondary" disabled={auth?.status !== 'authenticated'} onClick={async () => { await auth.logout(); onClose() }}>Keluar</Button>
      <Link to="/login" className="button button--primary" onClick={onClose}>Halaman masuk</Link>
    </div>
  </Modal>
}
