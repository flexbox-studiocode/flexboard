import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TasksPage from './TasksPage.jsx'

const scope = '/tasks'
const task = { id: 'test-task', title: 'Judul uji '.repeat(30), description: 'Deskripsi uji '.repeat(60), progress: 0 }
const member = { id: 'test-member', name: 'Nama uji panjang '.repeat(20), progress: null }
const resource = (status, extra = {}) => ({ status, scope, ...extra })
function view(props = {}) {
  return <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[scope]}><TasksPage {...props} /></MemoryRouter>
}

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
