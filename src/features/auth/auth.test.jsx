import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'

describe('Login alignment', () => {
  it('retains the card, decorative watermark and honest unavailable login', () => {
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByRole('region', { name: 'Masuk ke FlexBoard' })).toHaveClass('auth-card')
    expect(container.querySelector('.auth-watermark')).toHaveAttribute('alt', '')
    expect(screen.getByLabelText('Identitas akun')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Masuk belum tersedia' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Autentikasi belum terhubung')
    expect(screen.queryByText(/Demo123/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lihat pratinjau antarmuka' })).toHaveAttribute('href', '/')
    const submit = new Event('submit', { bubbles: true, cancelable: true })
    fireEvent(container.querySelector('form'), submit)
    expect(submit.defaultPrevented).toBe(true)
  })
})
