import { ConfirmDialog } from '../../components/ui/index.js'

/** Confirmation structure only; no project, policy, or permission is assumed. */
export default function ProjectArchiveDialog({ open, onClose }) {
  return <ConfirmDialog
    open={open}
    onClose={onClose}
    title="Pratinjau konfirmasi arsip proyek"
    description="Pengarsipan belum tersedia. Kebijakan arsip, dampaknya pada data terkait, dan otorisasi pengguna belum dikonfirmasi. Tidak ada proyek yang dipilih atau perubahan yang akan dijalankan."
    confirmLabel="Arsipkan proyek"
    disabled
  />
}
