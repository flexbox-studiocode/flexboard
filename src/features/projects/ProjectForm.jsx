import { useId, useState } from 'react'
import { Button, Input, Select, Textarea, UnavailableState } from '../../components/ui/index.js'
import './projects.css'

/** Local preview only. Edit mode never assumes project data or authorization. */
export default function ProjectForm({ mode = 'new', onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const noteId = useId()
  const editing = mode !== 'new'

  return <form className="project-dialog-form" aria-describedby={noteId} onSubmit={event => event.preventDefault()}>
    <p className="feature-note" id={noteId}>Pratinjau ini tidak mengirim atau menyimpan data. Input lokal dibuang saat dialog ditutup atau mode berubah; membuka kembali form akan menampilkan kolom kosong.</p>
    {editing && <UnavailableState title="Data proyek belum dapat dimuat" description="Data tersimpan dan hak edit belum dapat diverifikasi. Kolom kosong di bawah bukan data proyek dan tidak dapat diedit." />}
    <Input label="Nama proyek" name="name" value={name} onChange={event => setName(event.target.value)} placeholder="Tuliskan nama proyek" autoComplete="off" disabled={editing} />
    <Textarea label="Deskripsi proyek" name="description" value={description} onChange={event => setDescription(event.target.value)} rows={4} placeholder="Jelaskan tujuan dan ruang lingkup proyek" disabled={editing} />
    <Select label="Status proyek" value="" disabled hint="Pilihan status menunggu kesepakatan kontrak layanan."><option value="">Pilihan belum dikonfirmasi</option></Select>
    <UnavailableState title="Pengelolaan proyek belum aktif" description="Layanan proyek dan otorisasi pengguna belum terhubung. Pembuatan dan perubahan proyek belum tersedia." />
    <div className="project-dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>Tutup</Button><Button type="submit" disabled>Simpan proyek</Button></div>
  </form>
}
