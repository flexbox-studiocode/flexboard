import { useState } from 'react'
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectForm from './ProjectForm.jsx'

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

it('menerima teks lokal tanpa pilihan status atau penyimpanan', async () => {
  render(<FormLifecycle />)
  const user = userEvent.setup()
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
  await user.type(screen.getByLabelText('Nama proyek'), 'Input pengguna')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Catatan lokal')
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('Input pengguna')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('Catatan lokal')
  expect(screen.getByLabelText('Status proyek')).toBeDisabled()
  expect(screen.getByLabelText('Status proyek')).toHaveValue('')
  expect(screen.getByRole('option')).toHaveTextContent('Pilihan belum dikonfirmasi')
  expect(screen.getByRole('button', { name: 'Simpan proyek' })).toBeDisabled()
  expect(screen.getByText(/Input lokal dibuang saat dialog ditutup/)).toBeInTheDocument()
})

it('membuang input saat ditutup dan dibuka kembali', async () => {
  render(<FormLifecycle />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nama proyek'), 'Input pengguna')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Catatan lokal')
  await user.click(screen.getByRole('button', { name: 'Tutup' }))
  expect(screen.queryByLabelText('Nama proyek')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Buka form' }))
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
})

it('mengosongkan rancangan saat mode berubah tanpa mengaku memuat data edit', async () => {
  render(<FormLifecycle />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nama proyek'), 'Input pengguna')
  await user.type(screen.getByLabelText('Deskripsi proyek'), 'Catatan lokal')
  await user.click(screen.getByRole('button', { name: 'Buka edit' }))
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
  expect(screen.getByLabelText('Nama proyek')).toBeDisabled()
  expect(screen.getByLabelText('Deskripsi proyek')).toBeDisabled()
  expect(screen.getByText('Data proyek belum dapat dimuat')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Buka baru' }))
  expect(screen.getByLabelText('Nama proyek')).toHaveValue('')
  expect(screen.getByLabelText('Deskripsi proyek')).toHaveValue('')
  expect(screen.getByLabelText('Nama proyek')).toBeEnabled()
  expect(screen.queryByText('Data proyek belum dapat dimuat')).not.toBeInTheDocument()
})
