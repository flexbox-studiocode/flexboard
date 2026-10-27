import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import TaskFormPage from './TaskFormPage.jsx'

function renderForm() {
  render(<MemoryRouter initialEntries={['/tasks/new']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Link to="/tasks/unavailable/edit">Buka edit</Link>
    <Link to="/tasks/new">Buka baru</Link>
    <Routes><Route path="/tasks/new" element={<TaskFormPage />} /><Route path="/tasks/:id/edit" element={<TaskFormPage />} /></Routes>
  </MemoryRouter>)
}

it('menyusun checklist lokal tanpa status selesai, progres, atau penyimpanan', async () => {
  renderForm()
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  const input = screen.getByLabelText('Item checklist 1')
  expect(input).toHaveFocus()
  await userEvent.type(input, 'Teks yang dimasukkan pengguna')
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  expect(screen.getByLabelText('Item checklist 1')).toHaveValue('Teks yang dimasukkan pengguna')
  await userEvent.click(screen.getByRole('button', { name: 'Hapus item checklist 2' }))
  expect(screen.getByRole('status')).toHaveTextContent('1 item dalam rancangan lokal.')
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeDisabled()
})

it('mengembalikan fokus keyboard ke item berikutnya, sebelumnya, lalu tombol tambah setelah hapus', async () => {
  const user = userEvent.setup()
  renderForm()
  for (let index = 0; index < 3; index += 1) {
    await user.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
    await user.type(screen.getByLabelText(`Item checklist ${index + 1}`), `Rancangan lokal ${index + 1}`)
  }

  screen.getByLabelText('Item checklist 2').focus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Hapus item checklist 2' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Item checklist 2')).toHaveFocus()
  expect(screen.getByLabelText('Item checklist 2')).toHaveValue('Rancangan lokal 3')

  await user.tab()
  await user.keyboard(' ')
  expect(screen.getByLabelText('Item checklist 1')).toHaveFocus()
  expect(screen.getByLabelText('Item checklist 1')).toHaveValue('Rancangan lokal 1')

  await user.tab()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: 'Tambah item checklist' })).toHaveFocus()
  expect(screen.queryByLabelText('Item checklist 1')).not.toBeInTheDocument()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Item checklist 1')).toHaveFocus()
})

it('menempatkan judul, tenggat, arahan, dan field PRD dalam satu panel form', () => {
  renderForm()
  const panel = screen.getByRole('region', { name: 'Form informasi tugas' })
  expect(panel).toHaveClass('task-form-panel')
  for (const label of ['Judul tugas', 'Tenggat', 'Deskripsi', 'Proyek', 'Penanggung jawab', 'Bobot', 'Prioritas', 'Status']) {
    expect(panel).toContainElement(screen.getByLabelText(label))
  }
  expect(screen.getByLabelText('Judul tugas').closest('.task-form-hero-row')).toContainElement(screen.getByLabelText('Tenggat'))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

it('menolak bobot nol tanpa memilih default atau enum yang belum disepakati', async () => {
  renderForm()
  const weight = screen.getByLabelText('Bobot')
  expect(weight).toHaveDisplayValue('')
  await userEvent.type(weight, '0')
  expect(weight).toHaveAttribute('aria-invalid', 'true')
  await userEvent.clear(weight)
  await userEvent.type(weight, '0.5')
  expect(weight).not.toHaveAttribute('aria-invalid')
  expect(screen.getByLabelText('Prioritas')).toBeDisabled()
  expect(screen.getByLabelText('Status')).toBeDisabled()
})

it('menghapus rancangan lokal ketika berpindah referensi route tanpa mengaku memuat data', async () => {
  renderForm()
  await userEvent.type(screen.getByLabelText('Judul tugas'), 'Input lokal')
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  await userEvent.click(screen.getByRole('link', { name: 'Buka edit' }))
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('')
  expect(screen.getByLabelText('Judul tugas')).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Tambah item checklist' })).toBeDisabled()
  await userEvent.click(screen.getByRole('link', { name: 'Buka baru' }))
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('')
  expect(screen.queryByLabelText('Item checklist 1')).not.toBeInTheDocument()
})
