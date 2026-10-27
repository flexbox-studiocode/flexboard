import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskChecklistSection from './TaskChecklistSection.jsx'

// Presentation props only; not API fixtures or production fallback data.
const items = [
  { id: 'first', title: 'Item uji pertama', completed: false, canEdit: true },
  { id: 'second', title: 'Item uji kedua', completed: true, canEdit: true },
  { id: 'readonly', title: 'Item uji baca saja', completed: false, canEdit: false },
]

it('mengirim perubahan melalui callback tanpa mengubah kondisi tersimpan atau progres sendiri', async () => {
  const onItemChange = vi.fn()
  const onAdd = vi.fn()
  const { rerender } = render(<TaskChecklistSection items={items} progress={25} onItemChange={onItemChange} onAdd={onAdd} canAdd />)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Item uji pertama' }))
  expect(onItemChange).toHaveBeenLastCalledWith('first', true)
  expect(screen.getByRole('checkbox', { name: 'Item uji pertama' })).not.toBeChecked()
  expect(screen.getByRole('progressbar', { name: 'Progres tugas' })).toHaveAttribute('value', '25')

  await userEvent.click(screen.getByRole('checkbox', { name: 'Item uji kedua' }))
  expect(onItemChange).toHaveBeenLastCalledWith('second', false)
  expect(screen.getByRole('checkbox', { name: 'Item uji kedua' })).toBeChecked()
  await userEvent.click(screen.getByRole('button', { name: 'Tambah checklist' }))
  expect(onAdd).toHaveBeenCalledTimes(1)

  rerender(<TaskChecklistSection items={items.map(item => ({ ...item, completed: true }))} progress={80} onItemChange={onItemChange} />)
  expect(screen.getByRole('checkbox', { name: 'Item uji pertama' })).toBeChecked()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '80')
})

it('menonaktifkan item read-only atau tanpa callback meskipun canEdit diberikan', async () => {
  const onItemChange = vi.fn()
  const { rerender } = render(<TaskChecklistSection items={items} onItemChange={onItemChange} />)
  expect(screen.getByRole('checkbox', { name: 'Item uji baca saja' })).toBeDisabled()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Item uji baca saja' }))
  expect(onItemChange).not.toHaveBeenCalled()

  rerender(<TaskChecklistSection items={items} canAdd />)
  for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeDisabled()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

it('saving mengunci item terkait dan tambah tanpa mengunci item lain atau mengarang progres', () => {
  const props = { items, onItemChange: vi.fn(), onAdd: vi.fn(), canAdd: true }
  const { rerender } = render(<TaskChecklistSection {...props} savingItemId="first" />)
  expect(screen.getByRole('checkbox', { name: 'Item uji pertama' })).toBeDisabled()
  expect(screen.getByRole('checkbox', { name: 'Item uji kedua' })).toBeEnabled()
  expect(screen.getByRole('checkbox', { name: 'Item uji baca saja' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Menyimpan…')
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeDisabled()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

  rerender(<TaskChecklistSection {...props} />)
  expect(screen.getByRole('checkbox', { name: 'Item uji pertama' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeEnabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('tambah memerlukan data, capability, callback, dan tidak sedang saving', () => {
  const onAdd = vi.fn()
  const { rerender } = render(<TaskChecklistSection onAdd={onAdd} canAdd />)
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeDisabled()
  rerender(<TaskChecklistSection items={[]} onAdd={onAdd} />)
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeDisabled()
  rerender(<TaskChecklistSection items={[]} onAdd={onAdd} canAdd />)
  expect(screen.getByRole('button', { name: 'Tambah checklist' })).toBeEnabled()
})
