import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button, Input, Checkbox, ProgressBar, UnavailableState, EmptyState } from './index.js'

describe('Komponen UI tanpa data domain atau mock API', () => {
  it('memberi tipe button dan mencegah klik ketika loading', async () => {
    function Example() {
      const [count, setCount] = useState(0)
      return <><Button loading onClick={() => setCount(count + 1)}>Simpan</Button><output>{count}</output></>
    }
    render(<Example />)
    const button = screen.getByRole('button', { name: 'Simpan' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(screen.getByRole('status')).toHaveTextContent('0')
  })
  it('menghubungkan label, petunjuk dan error input', () => {
    render(<Input label="Judul" hint="Wajib diisi" error="Judul diperlukan" />)
    const input = screen.getByLabelText('Judul')
    expect(input).toHaveAccessibleDescription('Wajib diisi Judul diperlukan')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
  it('checkbox dapat digunakan dengan label', async () => {
    render(<Checkbox label="Pilihan" />)
    await userEvent.click(screen.getByLabelText('Pilihan'))
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
  it('membedakan progres nol dari progres belum diatur', () => {
    const { rerender } = render(<ProgressBar value={0} label="Progres" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0')
    expect(screen.getByText('0%')).toBeInTheDocument()
    rerender(<ProgressBar value={null} label="Progres" />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Belum diatur')).toBeInTheDocument()
  })
  it('tidak merender nilai progres yang tidak valid', () => {
    render(<ProgressBar value={120} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
  it('membedakan layanan belum tersedia dari data kosong', () => {
    render(<><UnavailableState /><EmptyState /></>)
    expect(screen.getByRole('heading', { name: 'Layanan belum tersedia' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Belum ada data' })).toBeInTheDocument()
  })
})
