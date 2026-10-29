import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import TaskFormPage from './TaskFormPage.jsx'
import { createTask, getTask, listMembers, listProjects, updateTask } from './taskApi.js'
import { useAuth } from '../auth/AuthContext.jsx'

vi.mock('./taskApi.js', () => ({ createTask: vi.fn(), getTask: vi.fn(), listMembers: vi.fn(), listProjectMembers: vi.fn(() => Promise.resolve({ members: [] })), listProjects: vi.fn(), updateTask: vi.fn() }))
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
const manager = { id: 'manager', role: 'manager', capabilities: { createTask: true, editTask: true } }
const savedTask = id => ({ id, title: `Tugas ${id}`, description: 'Arahan tersimpan', weight: 2, project_id: 'project-1', priority: 'high', status: 'in_progress', checklist: [], assignees: [{ id: 'member-1' }] })
beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({ profile: manager })
  listProjects.mockResolvedValue({ projects: [{ id: 'project-1', name: 'Proyek tim' }] })
  listMembers.mockResolvedValue({ members: [{ id: 'member-1', display_name: 'Anggota tim' }] })
  getTask.mockImplementation(async id => savedTask(id))
  createTask.mockResolvedValue({ id: 'created-task' })
  updateTask.mockResolvedValue({ id: 'unavailable' })
})
afterEach(cleanup)

function renderForm() {
  render(<MemoryRouter initialEntries={['/tasks/new']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Link to="/tasks/unavailable/edit">Buka edit</Link>
    <Link to="/tasks/another/edit">Buka edit lain</Link>
    <Link to="/tasks/new/edit">Buka edit ID new</Link>
    <Link to="/tasks/new">Buka baru</Link>
    <Routes><Route path="/tasks/new" element={<TaskFormPage />} /><Route path="/tasks/:id/edit" element={<TaskFormPage />} /><Route path="/tasks/:id" element={<h1>Detail tersimpan</h1>} /></Routes>
  </MemoryRouter>)
}

it('menyusun checklist draft tanpa status selesai atau progres sebelum disimpan', async () => {
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
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeEnabled()
  expect(createTask).not.toHaveBeenCalled()
})

it('mengirim payload tugas dan checklist lalu membuka detail setelah server berhasil', async () => {
  let resolveSave
  createTask.mockReturnValue(new Promise(resolve => { resolveSave = resolve }))
  renderForm()
  await screen.findByRole('option', { name: 'Proyek tim' })
  fireEvent.change(screen.getByLabelText('Judul tugas'), { target: { value: 'Tugas baru' } })
  await userEvent.selectOptions(screen.getByLabelText('Proyek'), 'project-1')
  await userEvent.selectOptions(screen.getByLabelText('Penanggung jawab'), 'member-1')
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  fireEvent.change(screen.getByLabelText('Item checklist 1'), { target: { value: 'Pekerjaan pertama' } })
  await userEvent.click(screen.getByRole('button', { name: 'Simpan tugas' }))
  expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tugas baru', projectId: 'project-1', assigneeIds: ['member-1'], weight: 1, dueAt: null, priority: 'medium', status: 'todo', checklist: [{ id: expect.any(String), title: 'Pekerjaan pertama' }] }))
  expect(updateTask).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /Menyimpan/ })).toBeDisabled()
  expect(screen.queryByRole('heading', { name: 'Detail tersimpan' })).not.toBeInTheDocument()
  resolveSave({ task: { id: 'created-task' } })
  expect(await screen.findByRole('heading', { name: 'Detail tersimpan' })).toBeInTheDocument()
})

it('menyimpan edit dengan ID route dan menampilkan penolakan izin server', async () => {
  updateTask.mockRejectedValue(new Error('HTTP_403'))
  renderForm()
  await userEvent.click(screen.getByRole('link', { name: 'Buka edit' }))
  await waitFor(() => expect(screen.getByLabelText('Judul tugas')).toHaveValue('Tugas unavailable'))
  fireEvent.change(screen.getByLabelText('Judul tugas'), { target: { value: 'Judul diubah' } })
  await userEvent.click(screen.getByRole('button', { name: 'Simpan tugas' }))
  expect(updateTask).toHaveBeenCalledWith('unavailable', expect.objectContaining({ title: 'Judul diubah', weight: 2, projectId: 'project-1' }))
  expect(createTask).not.toHaveBeenCalled()
  expect(await screen.findByRole('heading', { name: 'Anda tidak memiliki izin.' })).toBeInTheDocument()
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('Judul diubah')
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeEnabled()
})

it('menonaktifkan pembuatan untuk anggota tanpa kapabilitas createTask', () => {
  useAuth.mockReturnValue({ profile: { id: 'member', role: 'member', capabilities: {} } })
  renderForm()
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeDisabled()
  expect(createTask).not.toHaveBeenCalled()
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

it('menggunakan default domain dan validasi native untuk bobot positif', async () => {
  renderForm()
  const weight = screen.getByLabelText('Bobot')
  expect(weight).toHaveValue(1)
  expect(weight).toHaveAttribute('min', '0.01')
  fireEvent.change(weight, { target: { value: '0' } })
  expect(weight).toBeInvalid()
  expect(weight.validity.rangeUnderflow).toBe(true)
  fireEvent.change(weight, { target: { value: '0.5' } })
  expect(weight).toBeValid()
  expect(screen.getByLabelText('Prioritas')).toBeEnabled()
  expect(screen.getByLabelText('Prioritas')).toHaveValue('medium')
  expect(screen.getByLabelText('Status')).toBeEnabled()
  expect(screen.getByLabelText('Status')).toHaveValue('todo')
})

it('memuat tugas tersimpan saat route edit berubah dan mereset form baru', async () => {
  renderForm()
  await userEvent.type(screen.getByLabelText('Judul tugas'), 'Input lokal')
  await userEvent.type(screen.getByLabelText('Deskripsi'), 'Arahan lokal')
  await userEvent.type(screen.getByLabelText('Bobot'), '2')
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  await userEvent.type(screen.getByLabelText('Item checklist 1'), 'Item lokal')
  await userEvent.click(screen.getByRole('link', { name: 'Buka edit' }))
  const editTitle = screen.getByLabelText('Judul tugas')
  await waitFor(() => expect(editTitle).toHaveValue('Tugas unavailable'))
  expect(getTask).toHaveBeenCalledWith('unavailable')
  expect(editTitle).toBeEnabled()
  expect(screen.getByLabelText('Deskripsi')).toHaveValue('Arahan tersimpan')
  expect(screen.getByLabelText('Bobot')).toHaveValue(2)
  expect(screen.getByLabelText('Proyek')).toHaveValue('project-1')
  expect(screen.getByLabelText('Penanggung jawab')).toHaveValue(['member-1'])
  expect(screen.queryByLabelText('Item checklist 1')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tambah item checklist' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeEnabled()

  await userEvent.click(screen.getByRole('link', { name: 'Buka edit lain' }))
  expect(editTitle).not.toBeInTheDocument()
  await waitFor(() => expect(screen.getByLabelText('Judul tugas')).toHaveValue('Tugas another'))
  expect(getTask).toHaveBeenCalledWith('another')
  expect(screen.getByLabelText('Judul tugas')).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Tambah item checklist' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Simpan tugas' })).toBeEnabled()

  await userEvent.click(screen.getByRole('link', { name: 'Buka baru' }))
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('')
  expect(screen.getByLabelText('Judul tugas')).toBeEnabled()
  expect(screen.getByLabelText('Deskripsi')).toHaveValue('')
  expect(screen.getByLabelText('Bobot')).toHaveValue(1)
  expect(screen.queryByLabelText('Item checklist 1')).not.toBeInTheDocument()
})

it('memisahkan route baru dari route edit dengan ID new', async () => {
  renderForm()
  await userEvent.type(screen.getByLabelText('Judul tugas'), 'Rancangan baru')
  await userEvent.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  await userEvent.click(screen.getByRole('link', { name: 'Buka edit ID new' }))
  await waitFor(() => expect(screen.getByLabelText('Judul tugas')).toHaveValue('Tugas new'))
  expect(screen.getByLabelText('Judul tugas')).toBeEnabled()
  expect(screen.queryByLabelText('Item checklist 1')).not.toBeInTheDocument()
  expect(getTask).toHaveBeenCalledWith('new')
  await userEvent.click(screen.getByRole('link', { name: 'Buka baru' }))
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('')
  expect(screen.getByLabelText('Judul tugas')).toBeEnabled()
})

it('menjaga identitas item dan field lain ketika draft checklist diubah', async () => {
  const user = userEvent.setup()
  renderForm()
  await user.type(screen.getByLabelText('Judul tugas'), 'Judul lokal')
  await user.type(screen.getByLabelText('Deskripsi'), 'Arahan lokal')
  await user.clear(screen.getByLabelText('Bobot'))
  await user.type(screen.getByLabelText('Bobot'), '3.5')
  const due = screen.getByLabelText('Tenggat')
  await user.type(due, '2026-12-01T09:30')
  for (let index = 0; index < 2; index += 1) {
    await user.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
    await user.type(screen.getByLabelText(`Item checklist ${index + 1}`), `Item ${index + 1}`)
  }
  const first = screen.getByLabelText('Item checklist 1')
  const second = screen.getByLabelText('Item checklist 2')
  const firstId = first.closest('[data-checklist-id]').dataset.checklistId
  const secondId = second.closest('[data-checklist-id]').dataset.checklistId
  await user.type(first, ' diubah')
  expect(first.closest('[data-checklist-id]')).toHaveAttribute('data-checklist-id', firstId)
  await user.type(screen.getByLabelText('Judul tugas'), ' diubah')
  expect(screen.getByLabelText('Item checklist 1')).toBe(first)
  expect(first).toHaveValue('Item 1 diubah')
  await user.click(screen.getByRole('button', { name: 'Hapus item checklist 1' }))
  expect(screen.getByLabelText('Item checklist 1')).toBe(second)
  expect(second.closest('[data-checklist-id]')).toHaveAttribute('data-checklist-id', secondId)
  await user.click(screen.getByRole('button', { name: 'Tambah item checklist' }))
  const newId = screen.getByLabelText('Item checklist 2').closest('[data-checklist-id]').dataset.checklistId
  expect(newId).not.toBe(firstId)
  expect(newId).not.toBe(secondId)
  expect(screen.getByLabelText('Judul tugas')).toHaveValue('Judul lokal diubah')
  expect(screen.getByLabelText('Deskripsi')).toHaveValue('Arahan lokal')
  expect(screen.getByLabelText('Bobot')).toHaveValue(3.5)
  expect(due).toHaveValue('2026-12-01T09:30')
  expect(second).toHaveValue('Item 2')
})
