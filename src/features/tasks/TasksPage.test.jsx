import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TasksPage from './TasksPage.jsx'
import TaskCard from './TaskCard.jsx'

function withRouter(element) {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{element}</MemoryRouter>)
}

it('memisahkan ringkasan tugas dan panel progres anggota tanpa data contoh', () => {
  withRouter(<TasksPage />)
  const summary = screen.getByRole('region', { name: 'Ringkasan tugas' })
  const members = screen.getByRole('region', { name: 'Progres anggota' })
  expect(summary).toHaveClass('task-summary')
  expect(members).toHaveClass('task-members')
  expect(summary.compareDocumentPosition(members) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(within(summary).getByRole('heading', { name: 'Daftar tugas belum dapat dimuat' })).toBeInTheDocument()
  expect(within(members).getByRole('heading', { name: 'Progres anggota belum tersedia' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Pencarian dan filter tugas' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Tambah tugas/ })).toHaveAttribute('href', '/tasks/new')
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

it('kartu tugas memakai data props dan tidak memilih progres atau anggota bawaan', () => {
  withRouter(<TaskCard title="Judul dari adapter" description="Arahan dari adapter" />)
  expect(screen.getByRole('article')).toHaveClass('task-card')
  expect(screen.getByRole('heading', { name: 'Judul dari adapter' })).toBeInTheDocument()
  expect(screen.getByText('Arahan dari adapter')).toBeInTheDocument()
  expect(screen.getByText('Progres belum tersedia')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})
