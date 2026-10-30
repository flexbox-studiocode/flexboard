import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssigneePicker from './AssigneePicker.jsx'

const members = [
  { id: 'm1', display_name: 'Kiandra', job_title: 'Backend' },
  { id: 'm2', display_name: 'Rainer', job_title: 'Frontend' },
  { id: 'm3', display_name: 'Fakhri', job_title: 'UI/UX' },
  { id: 'm4', display_name: 'Bima', job_title: 'UI/UX' },
]

function Harness({ initial = [], list = members, disabled = false }) {
  const [selected, setSelected] = useState(initial)
  return <>
    <AssigneePicker members={list} selected={selected} onChange={setSelected} disabled={disabled} />
    <output data-testid="selected">{JSON.stringify(selected)}</output>
  </>
}

const chips = () => document.querySelectorAll('.assignee-chip')

describe('AssigneePicker multi-select chips', () => {
  it('adds a chip for each selected member without replacing previous selections', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const listbox = screen.getByRole('listbox')
    await user.click(within(listbox).getByRole('button', { name: /Kiandra/ }))
    await user.click(within(screen.getByRole('listbox')).getByRole('button', { name: /Rainer/ }))
    await user.click(within(screen.getByRole('listbox')).getByRole('button', { name: /Fakhri/ }))
    expect(chips()).toHaveLength(3)
    expect(screen.getByTestId('selected')).toHaveTextContent(JSON.stringify(['m1', 'm2', 'm3']))
  })

  it('hides already-selected members from the available options', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(within(screen.getByRole('listbox')).getByRole('button', { name: /Kiandra/ }))
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).queryByRole('button', { name: /Kiandra/ })).not.toBeInTheDocument()
    expect(within(listbox).getByRole('button', { name: /Rainer/ })).toBeInTheDocument()
  })

  it('removes only the clicked member via its X button and re-exposes it as an option', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['m1', 'm2']} />)
    expect(chips()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Hapus Kiandra' }))
    expect(chips()).toHaveLength(1)
    expect(screen.getByTestId('selected')).toHaveTextContent(JSON.stringify(['m2']))
    expect(within(screen.getByRole('listbox')).getByRole('button', { name: /Kiandra/ })).toBeInTheDocument()
  })

  it('never produces duplicate ids even when the same member cannot be re-picked while selected', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['m1']} />)
    // m1 is not available while selected, so a duplicate cannot be created through the UI.
    expect(within(screen.getByRole('listbox')).queryByRole('button', { name: /Kiandra/ })).not.toBeInTheDocument()
    await user.click(within(screen.getByRole('listbox')).getByRole('button', { name: /Rainer/ }))
    const parsed = JSON.parse(screen.getByTestId('selected').textContent)
    expect(new Set(parsed).size).toBe(parsed.length)
  })

  it('filters available members by name and by job title', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const search = screen.getByRole('searchbox')
    await user.type(search, 'front')
    expect(within(screen.getByRole('listbox')).getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Rainer/ })).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'UI/UX')
    // Fakhri and Bima both share the UI/UX job title.
    expect(within(screen.getByRole('listbox')).getAllByRole('button')).toHaveLength(2)
  })

  it('shows a clear message when the project has no active members', () => {
    render(<Harness list={[]} />)
    expect(screen.getByText(/belum memiliki anggota aktif/i)).toBeInTheDocument()
  })

  it('renders no selectable options when disabled', () => {
    render(<Harness disabled />)
    // Options may still be listed but every selectable control is disabled.
    for (const button of screen.queryAllByRole('button')) expect(button).toBeDisabled()
    expect(screen.getByRole('searchbox')).toBeDisabled()
  })
})
