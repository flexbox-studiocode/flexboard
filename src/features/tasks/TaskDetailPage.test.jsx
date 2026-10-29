import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TaskDetailPage from './TaskDetailPage.jsx'
import TaskMetadata from './TaskMetadata.jsx'
import TaskChecklistSection from './TaskChecklistSection.jsx'
import ActivityList from '../activity/ActivityList.jsx'
import { getTask, listComments, listUpdates } from './taskApi.js'
import { useAuth } from '../auth/AuthContext.jsx'

vi.mock('./taskApi.js', () => ({ getTask: vi.fn(), listComments: vi.fn(), listUpdates: vi.fn(), addComment: vi.fn(), addUpdate: vi.fn(), archiveTask: vi.fn(), updateChecklistItem: vi.fn() }))
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  useAuth.mockReturnValue({ profile: null })
  getTask.mockRejectedValue(new Error('HTTP_404'))
  listComments.mockRejectedValue(new Error('HTTP_404'))
  listUpdates.mockRejectedValue(new Error('HTTP_404'))
})
afterEach(cleanup)

it('menampilkan kegagalan API detail tanpa mengarang metadata, progres, atau izin', async () => {
  render(<MemoryRouter initialEntries={['/tasks/unavailable']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="tasks/:id" element={<TaskDetailPage />} /></Routes></MemoryRouter>)
  for (const label of ['Proyek', 'Penanggung jawab', 'Tenggat', 'Prioritas', 'Status tugas', 'Bobot']) expect(screen.getByText(label, { exact: true })).toBeInTheDocument()
  for (const label of ['Edit tugas', 'Tambah checklist', 'Tambah komentar']) expect(screen.getByRole('button', { name: label })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Arsipkan tugas' })).not.toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Komentar' })).toBeDisabled()
  expect(screen.getByRole('textbox', { name: 'Update pekerjaan' })).toBeDisabled()
  expect(await screen.findByRole('heading', { name: 'Detail tugas belum dapat dimuat' })).toBeInTheDocument()
  expect(getTask).toHaveBeenCalledWith('unavailable')
  expect(listComments).toHaveBeenCalledWith('unavailable')
  expect(listUpdates).toHaveBeenCalledWith('unavailable')
  const reportSurface = screen.getByLabelText('Panel laporan pekerjaan')
  expect(reportSurface).toHaveClass('task-report-surface')
  expect(reportSurface).toContainElement(screen.getByRole('heading', { name: 'Laporan belum dapat dimuat' }))
  expect(screen.getByRole('button', { name: 'Simpan laporan' })).toBeDisabled()
  expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument()
})

it('mengaktifkan edit dan arsip untuk manager setelah detail berhasil dimuat', async () => {
  useAuth.mockReturnValue({ profile: { id: 'manager', role: 'manager', capabilities: { editTask: true, archiveTask: true } } })
  getTask.mockResolvedValue({ id: 'saved-task', title: 'Tugas tersimpan', checklist: [] })
  listComments.mockResolvedValue([])
  listUpdates.mockResolvedValue([])
  render(<MemoryRouter initialEntries={['/tasks/saved-task']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="tasks/:id" element={<TaskDetailPage />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('button', { name: 'Edit tugas' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Arsipkan tugas' })).toBeDisabled()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Tugas tersimpan' })).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Edit tugas' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Arsipkan tugas' })).toBeEnabled()
  expect(screen.getByText('Belum ada komentar.')).toBeInTheDocument()
  expect(screen.getByText('Belum ada update.')).toBeInTheDocument()
})

it('metadata tidak memilih default status, bobot, tanggal, atau anggota', () => {
  render(<TaskMetadata />)
  expect(screen.getAllByText('Belum tersedia')).toHaveLength(6)
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

it('membedakan checklist belum tersedia dari respons kosong tanpa menyimpulkan progres', () => {
  const { rerender } = render(<TaskChecklistSection />)
  expect(screen.getByRole('heading', { name: 'Checklist belum tersedia' })).toBeInTheDocument()
  rerender(<TaskChecklistSection items={[]} />)
  expect(screen.getByRole('heading', { name: 'Belum ada checklist' })).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeDisabled()
})

it('riwayat membedakan sumber belum tersedia dari daftar kosong', () => {
  const { rerender } = render(<ActivityList />)
  expect(screen.getByRole('heading', { name: 'Riwayat belum tersedia' })).toBeInTheDocument()
  rerender(<ActivityList entries={[]} />)
  expect(screen.getByRole('heading', { name: 'Belum ada aktivitas' })).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})
