import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button, Input, Select, SearchField, Checkbox, ProgressBar, UnavailableState, EmptyState } from './index.js'

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
  it('pencarian menempatkan ikon di kontrol, terpisah dari label, petunjuk, dan error', async () => {
    render(<SearchField label="Pencarian lokal" hint="Petunjuk pencarian" error="Periksa input" />)
    const input = screen.getByRole('searchbox', { name: 'Pencarian lokal' })
    expect(input).toHaveAccessibleDescription('Petunjuk pencarian Periksa input')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const control = input.closest('.field__control--leading-icon')
    expect(control.querySelector('.field__leading-icon')).toHaveAttribute('aria-hidden', 'true')
    expect(control.querySelector('label, small')).toBeNull()
    await userEvent.type(input, 'Input lokal')
    expect(input).toHaveValue('Input lokal')
  })
  it('select mempertahankan perilaku native dan chevron hanya dekorasi', async () => {
    const { rerender } = render(<Select label="Pilihan lokal" hint="Pilih satu" error="Periksa pilihan"><option value="">Pilih</option><option value="one">Satu</option></Select>)
    const select = screen.getByRole('combobox', { name: 'Pilihan lokal' })
    expect(select).toHaveAccessibleDescription('Pilih satu Periksa pilihan')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select.parentElement.querySelector('.field__chevron')).toHaveAttribute('aria-hidden', 'true')
    await userEvent.selectOptions(select, 'one')
    expect(select).toHaveValue('one')
    rerender(<Select label="Pilihan lokal" disabled><option value="">Tidak tersedia</option></Select>)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
  it('select multiple dan listbox tidak mendapat chevron dropdown', () => {
    const { container, rerender } = render(<Select label="Banyak pilihan" multiple><option value="one">Satu</option></Select>)
    expect(screen.getByRole('listbox')).toHaveAttribute('multiple')
    expect(container.querySelector('.field__chevron')).toBeNull()
    rerender(<Select label="Daftar pilihan" size={4}><option value="one">Satu</option></Select>)
    expect(screen.getByRole('listbox')).toHaveAttribute('size', '4')
    expect(container.querySelector('.field__chevron')).toBeNull()
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
