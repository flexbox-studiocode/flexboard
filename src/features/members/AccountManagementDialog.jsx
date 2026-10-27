import { useId } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button, Modal, Select } from '../../components/ui/index.js'
import './members.css'

export function AccountManagementForm({ onClose }) {
  const noticeId = useId()

  return <form className="account-management-form" aria-describedby={noticeId} onSubmit={event => event.preventDefault()}>
    <p id={noticeId} className="account-management-notice"><LockKeyhole size={20} aria-hidden="true" /><span>Ini hanya pratinjau tampilan, bukan akses pengelolaan akun. Identitas, daftar peran, status akun, dan izin belum tersedia dari server. Tidak ada perubahan yang dapat disimpan.</span></p>
    <div className="account-management-fields">
      <Select label="Peran akun" value="" disabled hint="Daftar peran menunggu kontrak layanan server."><option value="">Belum tersedia</option></Select>
      <Select label="Status akun" value="" disabled hint="Daftar status menunggu kontrak layanan server."><option value="">Belum tersedia</option></Select>
    </div>
    <div className="account-management-actions">
      <Button variant="secondary" onClick={onClose}>Tutup pratinjau</Button>
      <Button type="submit" disabled>Simpan perubahan</Button>
    </div>
  </form>
}

export default function AccountManagementDialog({ open, onClose }) {
  return <Modal open={open} onClose={onClose} title="Pratinjau pengelolaan akun" className="account-management-dialog">
    <AccountManagementForm onClose={onClose} />
  </Modal>
}
