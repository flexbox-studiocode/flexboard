import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TeamProgressPage from './TeamProgressPage.jsx'
import MemberProgressList from './MemberProgressList.jsx'

const router = children => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>

describe('Team progress alignment', () => {
  it('uses one member panel without dominant metrics or fabricated progress', () => {
    const { container } = render(router(<TeamProgressPage />))
    const panel = screen.getByRole('region', { name: 'Progres per anggota' })
    expect(within(panel).getByRole('heading', { name: 'Progres tim belum dapat dimuat' })).toBeInTheDocument()
    expect(container.querySelector('.feature-metric')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah tugas' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Proyek' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Anggota' })).toBeDisabled()
    expect(screen.getByText(/Data yang belum tersedia bukan progres 0%/)).toBeInTheDocument()
  })

  it('distinguishes unavailable entries from a loaded empty scope', () => {
    const { rerender } = render(<MemberProgressList />)
    expect(screen.getByRole('heading', { name: 'Progres tim belum dapat dimuat' })).toBeInTheDocument()
    rerender(<MemberProgressList entries={[]} />)
    expect(screen.getByRole('heading', { name: 'Belum ada progres anggota' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows only supplied measurements and never derives an average', () => {
    const { rerender } = render(router(<MemberProgressList entries={[{ id: 'provided', name: 'Teks anggota', roleLabel: 'Teks peran', projectLabel: 'Teks proyek', progress: 0 }]} />))
    expect(screen.getByRole('progressbar', { name: 'Progres Teks anggota' })).toHaveAttribute('value', '0')
    expect(screen.getByText('rata-rata').previousElementSibling).toHaveTextContent('—')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    rerender(router(<MemberProgressList entries={[{ id: 'provided', progress: 101, averageProgress: Number.NaN }]} />))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText('101%')).not.toBeInTheDocument()
  })
})
