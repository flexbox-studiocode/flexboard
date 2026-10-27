import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'

describe('Login', () => {
  it('menampilkan form login nyata tanpa kredensial demo', () => {
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByRole('region', { name: 'Masuk ke FlexBoard' })).toHaveClass('auth-card')
    expect(container.querySelector('.auth-watermark')).toHaveAttribute('alt', '')
    expect(screen.getByLabelText('Email')).toBeEnabled()
    expect(screen.getByLabelText('Password')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled()
    expect(screen.queryByText(/Demo123/)).not.toBeInTheDocument()
  })

  it('mengirim credential ke endpoint Better Auth dan menampilkan error umum', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.test')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(fetch).toHaveBeenCalledWith('/api/auth/sign-in/email', expect.objectContaining({ method: 'POST', credentials: 'include' }))
    expect(await screen.findByText('Email atau password tidak valid.')).toBeInTheDocument()
  })
})
