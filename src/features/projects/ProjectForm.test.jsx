import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectForm from './ProjectForm.jsx'
import { createProject, listMembers } from '../tasks/taskApi.js'

vi.mock('../tasks/taskApi.js', () => ({ createProject: vi.fn(), listMembers: vi.fn() }))

// Exercise the same mount/key lifecycle as ProjectDialog without mocking native dialogs.
function FormLifecycle() {
  const [open, setOpen] = useState(true)
  const [mode, setMode] = useState('new')
  return <>
    <button type="button" onClick={() => setOpen(true)}>Buka form</button>
    <button type="button" onClick={() => setMode('edit')}>Buka edit</button>
    <button type="button" onClick={() => setMode('new')}>Buka baru</button>
    {open && <ProjectForm key={mode} mode={mode} onClose={() => setOpen(false)} />}
  </>
}

beforeEach(() => {
  vi.resetAllMocks()
  listMembers.mockResolvedValue({
    members: [
      { id: 'member-1', display_name: 'Kiandra', role: 'member', is_active: true },
      { id: 'member-2', display_name: 'Rainer', role: 'member', is_active: true },
      { id: 'member-3', display_name: 'Fakhri', role: 'member', is_active: true },
      { id: 'member-4', display_name: 'Mantan Anggota', role: 'member', is_active: false },
      { id: 'leader-1', display_name: 'Pemimpin', role: 'leader', is_active: true },
    ],
  })
  createProject.mockResolvedValue({ project: { id: 'project-1' } })
})
afterEach(cleanup)

it('menampilkan field nama, deskripsi, kategori, dan tombol simpan/batal', async () => {
  render(<FormLifecycle />)
  const user = userEvent.setup()
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
  await user.type(screen.getByLabelText('Nama proyek'), 'Website Company Profile')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Profil perusahaan')
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('Website Company Profile')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('Profil perusahaan')
  expect(screen.getByRole('button', { name: 'Simpan proyek' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Batal' })).toBeEnabled()
})

it('menyediakan empat kategori proyek dengan nilai internal yang tersimpan', async () => {
  render(<FormLifecycle />)
  const category = await screen.findByLabelText('Kategori proyek')
  const options = screen.getAllByRole('option').filter(option => option.closest('#project-category'))
  expect(options.map(option => option.getAttribute('value'))).toEqual([
    'corporate_enterprise',
    'startup_sme',
    'government_public',
    'educational_community',
  ])
  expect(category).toHaveValue('corporate_enterprise')
})

it('memuat anggota aktif sebagai pilihan dan mengecualikan anggota nonaktif serta leader', async () => {
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  const members = screen.getByLabelText('Anggota proyek')
  const names = Array.from(members.options).map(option => option.textContent)
  expect(names).toEqual(['Kiandra', 'Rainer', 'Fakhri'])
})

it('mengirim proyek dan anggota terpilih berdasarkan ID profil aktif', async () => {
  const user = userEvent.setup()
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  await user.type(screen.getByLabelText('Nama proyek'), 'Website Company Profile FlexBox')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Situs profil perusahaan')
  await user.selectOptions(screen.getByLabelText('Kategori proyek'), 'corporate_enterprise')
  await user.selectOptions(screen.getByLabelText('Anggota proyek'), ['member-1', 'member-2', 'member-3'])
  await user.click(screen.getByRole('button', { name: 'Simpan proyek' }))
  await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1))
  expect(createProject).toHaveBeenCalledWith({
    name: 'Website Company Profile FlexBox',
    description: 'Situs profil perusahaan',
    category: 'corporate_enterprise',
    memberIds: ['member-1', 'member-2', 'member-3'],
  })
})

it('menolak menyimpan proyek tanpa nama', async () => {
  const user = userEvent.setup()
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  await user.click(screen.getByRole('button', { name: 'Simpan proyek' }))
  expect(screen.getByLabelText('Nama proyek')).toBeInvalid()
  expect(screen.getByLabelText('Nama proyek')).toBeRequired()
  expect(createProject).not.toHaveBeenCalled()
})

it('menampilkan pesan server saat izin ditolak', async () => {
  createProject.mockRejectedValue(new Error('HTTP_403'))
  const user = userEvent.setup()
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  await user.type(screen.getByLabelText('Nama proyek'), 'Proyek terbatas')
  await user.click(screen.getByRole('button', { name: 'Simpan proyek' }))
  expect(await screen.findByRole('heading', { name: 'Anda tidak memiliki izin.' })).toBeInTheDocument()
})

it('membuang input saat ditutup dan dibuka kembali', async () => {
  const user = userEvent.setup()
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  await user.type(screen.getByLabelText('Nama proyek'), 'Input pengguna')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Catatan lokal')
  await user.click(screen.getByRole('button', { name: 'Batal' }))
  expect(screen.queryByLabelText('Nama proyek')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Buka form' }))
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
})

it('mengosongkan rancangan saat mode berubah', async () => {
  const user = userEvent.setup()
  render(<FormLifecycle />)
  await screen.findByRole('option', { name: 'Kiandra' })
  await user.type(screen.getByLabelText('Nama proyek'), 'Input pengguna')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Catatan lokal')
  await user.click(screen.getByRole('button', { name: 'Buka edit' }))
  await waitFor(() => expect(screen.getByLabelText('Nama proyek')).toHaveValue(''))
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
  await user.click(screen.getByRole('button', { name: 'Buka baru' }))
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
})
