import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Modal, UnavailableState } from '../../components/ui/index.js'
import './profile.css'

export default function ProfileDialog({ open, onClose }) {
  return <Modal open={open} onClose={onClose} title="Profil akun" className="profile-dialog">
    <UnavailableState title="Profil belum dapat dimuat" description="Belum ada sesi tervalidasi. Identitas, role, status akun, tugas, dan progres tidak ditampilkan sebelum layanan autentikasi tersedia." />
    <dl className="profile-details">
      <div><dt>Nama tampilan</dt><dd>—</dd></div>
      <div><dt>Role akses</dt><dd>—</dd></div>
      <div><dt>Status akun</dt><dd>—</dd></div>
      <div><dt>Tugas aktif</dt><dd>—</dd></div>
      <div><dt>Progres pribadi</dt><dd>—</dd></div>
    </dl>
    <p className="profile-disclosure" id="profile-permissions"><LockKeyhole size={16} aria-hidden="true" />Perubahan profil, role, status, dan logout memerlukan sesi serta izin server. Tidak ada akun aktif pada pratinjau ini.</p>
    <div className="profile-actions" aria-describedby="profile-permissions">
      <Button variant="secondary" disabled>Ubah profil</Button>
      <Button variant="secondary" disabled>Kelola role/status</Button>
      <Button variant="secondary" disabled>Keluar</Button>
      <Link to="/login" className="button button--primary" onClick={onClose}>Halaman masuk</Link>
    </div>
  </Modal>
}
