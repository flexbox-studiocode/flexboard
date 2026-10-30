import { useState } from 'react'
import { Button, Input, Modal, Select, UnavailableState } from '../../components/ui/index.js'
import { updateMember } from './memberApi.js'
import './members.css'

const errorText = message => message === 'HTTP_403' ? 'Anda tidak memiliki izin untuk tindakan ini.' : message === 'HTTP_400' ? 'Data tidak valid.' : 'Perubahan gagal disimpan.'

// `roleOnly` opens the same dialog focused on the role field, so the card can offer a dedicated
// "Ubah role" affordance without duplicating the update request logic.
export default function EditMemberDialog({ open, onClose, member, onSaved, canChangeRole = false, roleOnly = false }) {
  return <Modal open={open} onClose={onClose} title={roleOnly ? 'Ubah role anggota' : 'Edit anggota'}>
    {open && member && <EditMemberForm key={`${member.id}-${roleOnly}`} member={member} onClose={onClose} onSaved={onSaved} canChangeRole={canChangeRole} roleOnly={roleOnly} />}
  </Modal>
}

function EditMemberForm({ member, onClose, onSaved, canChangeRole, roleOnly = false }) {
  const [displayName, setDisplayName] = useState(member.display_name || '')
  const [jobTitle, setJobTitle] = useState(member.job_title || '')
  const [role, setRole] = useState(member.role)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(e) {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {}
    if (displayName.trim() && displayName !== member.display_name) payload.displayName = displayName
    if (jobTitle !== (member.job_title || '')) payload.jobTitle = jobTitle
    if (canChangeRole && role !== member.role) payload.role = role
    if (!Object.keys(payload).length) { setSaving(false); onClose(); return }
    try { const result = await updateMember(member.id, payload); onSaved?.(result?.member || result); onClose() }
    catch (err) { setError(errorText(err.message)) } finally { setSaving(false) }
  }
  return <form className="project-dialog-form" onSubmit={submit}>
    {error && <UnavailableState title={error} />}
    <Input label="Nama tampilan" name="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} required disabled={roleOnly} />
    <Input label="Email" name="email" value={member.email || 'Email dikelola Better Auth'} readOnly disabled hint="Email tidak dapat diubah dari sini." />
    {!roleOnly && <Input label="Job title" name="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Contoh: Frontend Developer" />}
    {canChangeRole && <Select label="Role" name="role" value={role} onChange={e => setRole(e.target.value)} autoFocus={roleOnly} hint={roleOnly ? 'Mengubah role akan mencabut sesi login anggota agar izin terbaru berlaku.' : undefined}>
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </Select>}
    <div className="project-dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : roleOnly ? 'Simpan role' : 'Simpan perubahan'}</Button></div>
  </form>
}
