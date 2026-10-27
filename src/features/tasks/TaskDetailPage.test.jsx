import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TaskDetailPage from './TaskDetailPage.jsx'
import TaskMetadata from './TaskMetadata.jsx'
import TaskChecklistSection from './TaskChecklistSection.jsx'
import ActivityList from '../activity/ActivityList.jsx'

it('menampilkan struktur detail tanpa mengarang metadata, progres, atau izin', () => {
  render(<MemoryRouter initialEntries={['/tasks/unavailable']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="tasks/:id" element={<TaskDetailPage />} /></Routes></MemoryRouter>)
  for (const label of ['Proyek', 'Penanggung jawab', 'Tenggat', 'Prioritas', 'Status tugas', 'Bobot']) expect(screen.getByText(label, { exact: true })).toBeInTheDocument()
  for (const label of ['Edit tugas', 'Arsipkan tugas', 'Tambah checklist']) expect(screen.getByRole('button', { name: label })).toBeDisabled()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.getByText('unavailable', { selector: 'code' })).toBeInTheDocument()
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
