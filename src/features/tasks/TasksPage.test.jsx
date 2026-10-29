import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TasksPage from './TasksPage.jsx'
import TaskCard from './TaskCard.jsx'
import { listTasks } from './taskApi.js'
import { useAuth } from '../auth/AuthContext.jsx'

vi.mock('./taskApi.js', () => ({ listTasks: vi.fn() }))
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({ profile: { id: 'manager', role: 'manager', capabilities: { createTask: true } } })
  listTasks.mockResolvedValue({ items: [] })
})
afterEach(cleanup)

const scope = '/tasks'
const task = { id: 'test-task', title: 'Judul uji '.repeat(30), description: 'Deskripsi uji '.repeat(60), progress: 0 }
const member = { id: 'test-member', name: 'Nama uji panjang '.repeat(20), progress: null }
const resource = (status, extra = {}) => ({ status, scope, ...extra })
function view(props = {}) {
  return <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[scope]}><TasksPage {...props} /></MemoryRouter>
}

it('mempertahankan hierarki panel dan tautan pratinjau tanpa kartu contoh', () => {
  render(view())
  const summary = screen.getByRole('region', { name: 'Ringkasan tugas' })
  const members = screen.getByRole('region', { name: 'Progres anggota' })
  expect(summary).toHaveClass('task-summary')
  expect(members).toHaveClass('task-members')
  expect(summary.compareDocumentPosition(members) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Pencarian dan filter tugas' })).toBeVisible()
  const addTask = screen.getByRole('link', { name: /Tambah tugas/ })
  expect(addTask).toHaveAttribute('href', '/tasks/new')
  expect(addTask.querySelector('svg')).toHaveAttribute('width', '20')
  expect(addTask.querySelector('svg')).toHaveAttribute('stroke-width', '1.5')
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

it('menyembunyikan pembuatan tugas bagi anggota tanpa kapabilitas', () => {
  useAuth.mockReturnValue({ profile: { id: 'member', role: 'member', capabilities: {} } })
  render(view({ tasks: resource('success', { items: [] }) }))
  expect(screen.queryByRole('link', { name: /Tambah tugas/ })).not.toBeInTheDocument()
  expect(listTasks).not.toHaveBeenCalled()
})

it('kartu tugas tetap tidak memilih progres atau anggota bawaan', () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TaskCard title="Judul dari adapter" description="Arahan dari adapter" /></MemoryRouter>)
  expect(screen.getByRole('article')).toHaveClass('task-card')
  expect(screen.getByRole('heading', { name: 'Judul dari adapter' })).toBeVisible()
  expect(screen.getByText('Arahan dari adapter')).toBeVisible()
  expect(screen.getByText('Progres belum tersedia')).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

it('default tetap unavailable tanpa data, pagination, atau progres palsu', () => {
  render(view())
  expect(screen.getByRole('heading', { name: 'Daftar tugas belum dapat dimuat' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Progres anggota belum tersedia' })).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: /halaman/i })).not.toBeInTheDocument()
})

it('membedakan hasil kosong sukses dari belum tersedia dan tidak menganggapnya progres nol', () => {
  render(view({ tasks: resource('success', { items: [] }), members: resource('success', { items: [] }) }))
  expect(screen.getByRole('heading', { name: 'Tidak ada tugas dalam hasil ini' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Belum ada progres anggota' })).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

it('transisi props hanya merender data terkini dan retry opsional dengan keyboard', async () => {
  const retry = vi.fn()
  const { rerender } = render(view({ tasks: resource('success', { items: [task] }), members: resource('success', { items: [member] }) }))
  expect(screen.getByRole('heading', { name: task.title.trim() })).toBeVisible()
  expect(screen.getByRole('progressbar', { name: 'Progres tugas' })).toHaveAttribute('value', '0')
  expect(screen.getByRole('heading', { name: member.name.trim() })).toBeVisible()
  expect(screen.queryByRole('progressbar', { name: `Progres ${member.name}` })).not.toBeInTheDocument()

  rerender(view({ tasks: resource('loading'), members: resource('loading') }))
  expect(screen.queryByText(task.title.trim())).not.toBeInTheDocument()
  expect(screen.queryByText(member.name.trim())).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Memuat daftar tugas…' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Memuat progres anggota…' })).toBeVisible()

  rerender(view({ tasks: resource('error', { onRetry: retry, error: 'SQL secret must not be displayed' }), members: resource('error') }))
  expect(screen.getByRole('heading', { name: 'Daftar tugas gagal dimuat' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Progres anggota gagal dimuat' })).toBeVisible()
  expect(screen.queryByText(/SQL secret/)).not.toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'Coba lagi' })).toHaveLength(1)
  screen.getByRole('button', { name: 'Coba lagi' }).focus()
  await userEvent.keyboard('{Enter}')
  expect(retry).toHaveBeenCalledTimes(1)

  rerender(view({ tasks: resource('success', { items: [{ ...task, title: 'Hasil baru', progress: null }] }) }))
  expect(screen.getByRole('heading', { name: 'Hasil baru' })).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
})

it('menghilangkan hasil dan retry scope lama ketika query berubah sampai props scope diperbarui', () => {
  const retry = vi.fn()
  const props = { tasks: resource('success', { items: [task] }), members: resource('error', { onRetry: retry }) }
  const { rerender } = render(view(props))
  fireEvent.change(screen.getByLabelText('Pencarian'), { target: { value: 'baru' } })
  expect(screen.queryByRole('heading', { name: task.title.trim() })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Daftar tugas belum dapat dimuat' })).toBeVisible()
  expect(screen.getByRole('status')).toHaveTextContent('Pencarian dan filter belum dijalankan')
  rerender(view({ tasks: { ...props.tasks, scope: '/tasks?q=baru' } }))
  expect(screen.getByRole('heading', { name: task.title.trim() })).toBeVisible()
})

it('success tanpa array menjadi error bukan hasil kosong; status/scope tak dikenal tetap unavailable', () => {
  const { rerender } = render(view({ tasks: resource('success'), members: resource('unexpected', { items: [member] }) }))
  expect(screen.getByRole('heading', { name: 'Daftar tugas gagal dimuat' })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Tidak ada tugas dalam hasil ini' })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Progres anggota belum tersedia' })).toBeVisible()
  rerender(view({ tasks: { status: 'success', items: [task] } }))
  expect(within(screen.getByRole('region', { name: 'Ringkasan tugas' })).getByRole('heading', { name: 'Daftar tugas belum dapat dimuat' })).toBeVisible()
})
