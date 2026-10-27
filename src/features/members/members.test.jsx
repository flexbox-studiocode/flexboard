import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberCard from './MemberCard.jsx'
import { AccountManagementForm } from './AccountManagementDialog.jsx'

// Generic presentation values only. No account fixtures or API substitutes.
describe('MemberCard', () => {
  it('keeps absent measurements unavailable rather than inventing zero', () => {
    render(<MemberCard />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('—')
    expect(screen.getByText('Tugas aktif').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('Status akun').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('Belum tersedia')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders caller-provided text without deriving roles or status', () => {
    render(<MemberCard name="Teks judul" roleLabel="Teks peran" statusLabel="Teks status" activeTaskCount={0} progress={0} />)
    expect(screen.getByRole('heading', { name: 'Teks judul' })).toBeInTheDocument()
    expect(screen.getByText('Teks peran')).toBeInTheDocument()
    expect(screen.getByText('Teks status')).toBeInTheDocument()
    expect(screen.getByText('Tugas aktif').nextElementSibling).toHaveTextContent('0')
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
  })

  it('does not display invalid measurements as facts', () => {
    const { rerender } = render(<MemberCard activeTaskCount={-1} progress={101} />)
    expect(screen.getByText('Tugas aktif').nextElementSibling).toHaveTextContent('—')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    rerender(<MemberCard activeTaskCount={1.5} progress={Number.NaN} />)
    expect(screen.getByText('Tugas aktif').nextElementSibling).toHaveTextContent('—')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

describe('AccountManagementForm preview content', () => {
  it('allows closing the preview without changing account data', async () => {
    let closeCount = 0
    render(<AccountManagementForm onClose={() => { closeCount += 1 }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tutup pratinjau' }))
    expect(closeCount).toBe(1)
  })

  it('disables unknown enum controls and saving without provisioning actions', async () => {
    const { container } = render(<AccountManagementForm />)
    for (const label of ['Peran akun', 'Status akun']) {
      const select = screen.getByRole('combobox', { name: label })
      expect(select).toBeDisabled()
      expect(select).toHaveValue('')
      expect(within(select).getAllByRole('option')).toHaveLength(1)
      expect(within(select).getByRole('option')).toHaveValue('')
    }
    const save = screen.getByRole('button', { name: 'Simpan perubahan' })
    expect(save).toBeDisabled()
    await userEvent.click(save)
    expect(screen.getByText(/bukan akses pengelolaan akun/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /undang|reset|buat akun/i })).not.toBeInTheDocument()
    const submit = new Event('submit', { bubbles: true, cancelable: true })
    fireEvent(container.querySelector('form'), submit)
    expect(submit.defaultPrevented).toBe(true)
  })
})
