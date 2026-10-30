import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DatePicker from './DatePicker.jsx'

function Harness({ initial = '' }) {
  const [value, setValue] = useState(initial)
  return <>
    <DatePicker label="Tenggat" id="due" value={value} onChange={setValue} />
    <output data-testid="value">{value}</output>
  </>
}

const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const indo = date => date.toLocaleDateString('id-ID')

describe('DatePicker', () => {
  it('displays the selected date in DD/MM/YYYY format with no time component', () => {
    render(<DatePicker label="Tenggat" id="due" value="2026-10-30" onChange={() => {}} />)
    const input = screen.getByLabelText('Tenggat')
    expect(input).toHaveValue('30/10/2026')
    expect(input.value).not.toMatch(/\d{2}:\d{2}/)
  })

  it('shows an empty input when no date is selected', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Tenggat')).toHaveValue('')
  })

  it('opens the calendar on click and marks today, closes when a day is chosen', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Tenggat')
    await user.click(input)
    const dialog = screen.getByRole('dialog', { name: 'Pilih tanggal' })
    // Today is highlighted.
    expect(within(dialog).getByRole('button', { name: indo(new Date()) })).toHaveClass('is-today')
    // Pick the 15th of the current month.
    const target = new Date(new Date().getFullYear(), new Date().getMonth(), 15)
    await user.click(within(dialog).getByRole('button', { name: indo(target) }))
    // Calendar closes and the value is the picked day.
    expect(screen.queryByRole('dialog', { name: 'Pilih tanggal' })).not.toBeInTheDocument()
    expect(screen.getByTestId('value')).toHaveTextContent(iso(target))
    expect(input).toHaveValue(`15/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`)
  })

  it('Today selects the current day and closes the calendar', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByLabelText('Tenggat'))
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.queryByRole('dialog', { name: 'Pilih tanggal' })).not.toBeInTheDocument()
    expect(screen.getByTestId('value')).toHaveTextContent(iso(new Date()))
    expect(screen.getByLabelText('Tenggat')).toHaveValue(indo(new Date()))
  })

  it('Clear empties the value and closes the calendar', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-10-30" />)
    expect(screen.getByTestId('value')).toHaveTextContent('2026-10-30')
    await user.click(screen.getByLabelText('Tenggat'))
    await user.click(screen.getByRole('button', { name: /Clear/ }))
    expect(screen.queryByRole('dialog', { name: 'Pilih tanggal' })).not.toBeInTheDocument()
    expect(screen.getByTestId('value')).toHaveTextContent('')
    expect(screen.getByLabelText('Tenggat')).toHaveValue('')
  })

  it('closes when clicking outside the calendar', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByLabelText('Tenggat'))
    expect(screen.getByRole('dialog', { name: 'Pilih tanggal' })).toBeInTheDocument()
    await user.click(document.body)
    expect(screen.queryByRole('dialog', { name: 'Pilih tanggal' })).not.toBeInTheDocument()
  })

  it('reopens with the previously selected date still shown and highlighted', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-10-30" />)
    await user.click(screen.getByLabelText('Tenggat'))
    const dialog = screen.getByRole('dialog', { name: 'Pilih tanggal' })
    const selectedDay = within(dialog).getByRole('button', { name: indo(new Date(2026, 9, 30)) })
    expect(selectedDay).toHaveClass('is-selected')
    expect(selectedDay).toHaveAttribute('aria-pressed', 'true')
  })

  it('navigates between months and the selected value persists across navigation', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-01-15" />)
    await user.click(screen.getByLabelText('Tenggat'))
    const dialog = () => screen.getByRole('dialog', { name: 'Pilih tanggal' })
    expect(within(dialog()).getByText(/Januari 2026/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bulan berikutnya' }))
    expect(within(dialog()).getByText(/Februari 2026/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }))
    expect(within(dialog()).getByText(/Januari 2026/)).toBeInTheDocument()
    // The underlying value is unchanged.
    expect(screen.getByTestId('value')).toHaveTextContent('2026-01-15')
  })

  it('does not shift the date by one day across timezones (stores a plain date string)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DatePicker label="Tenggat" id="due" value="2026-10-30" onChange={onChange} />)
    await user.click(screen.getByLabelText('Tenggat'))
    const target = new Date(2026, 9, 1)
    await user.click(screen.getByRole('button', { name: indo(target) }))
    // Exactly the local calendar day, never shifted by UTC conversion.
    expect(onChange).toHaveBeenCalledWith('2026-10-01')
  })
})
