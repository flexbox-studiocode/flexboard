import { useState } from 'react'
import { Button, Input, Modal, Textarea, UnavailableState } from '../../components/ui/index.js'
import './projects.css'

/** Unavailable-state foundation. No permission or persistence is inferred from props. */
export default function ProjectDialog({ open, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  return <Modal open={open} onClose={onClose} title="Pratinjau form proyek"><form className="project-dialog-form" onSubmit={event => event.preventDefault()}><p className="feature-note">Struktur formulir proyek dapat ditinjau. Input hanya berada pada dialog ini dan tidak akan disimpan.</p><Input label="Nama proyek" value={name} onChange={event => setName(event.target.value)} placeholder="Tuliskan nama proyek" autoComplete="off" /><Textarea label="Deskripsi proyek" value={description} onChange={event => setDescription(event.target.value)} rows={4} placeholder="Jelaskan tujuan dan ruang lingkup proyek" /><UnavailableState title="Pengelolaan proyek belum aktif" description="Layanan proyek dan izin pengguna belum terhubung. Pembuatan proyek tidak dapat dijalankan sampai backend memvalidasi akses." /><div className="project-dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>Tutup</Button><Button type="submit" disabled>Simpan proyek</Button></div></form></Modal>
}
