import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'

function renderRoute(route) {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}
describe('Routing aplikasi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })))
  })
  afterEach(() => {
    try {
      for (const call of fetch.mock.calls) expect(call).toEqual(['/api/auth/me', { credentials: 'include' }])
    } finally { vi.unstubAllGlobals() }
  })
  it.each([
    ['/', 'Beranda'], ['/tasks', 'Tugas Kami'], ['/team-progress', 'Progres Tim'], ['/members', 'Anggota'], ['/activity', 'Aktivitas'], ['/tasks/new', 'Form tugas baru'], ['/tasks/unavailable/edit', 'Edit tugas'],
  ])('menampilkan %s tanpa data produksi', async (route, heading) => {
    renderRoute(route)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(await screen.findByText('Belum masuk')).toBeInTheDocument()
    const session = within(screen.getByRole('complementary', { name: 'Status sesi' }))
    expect(await session.findByText('Belum ada sesi aktif.')).toBeInTheDocument()
    expect(session.getByRole('link', { name: 'Masuk', exact: true })).toHaveAttribute('href', '/login')
    expect(fetch).toHaveBeenCalled()
  })
  it('login menyediakan form tanpa akun demo', async () => {
    renderRoute('/login')
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(screen.getByRole('heading', { name: 'Masuk ke FlexBoard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled()
    expect(screen.getByLabelText('Email')).toBeEnabled()
    expect(screen.getByLabelText('Password')).toBeEnabled()
  })
  it('mendukung halaman tidak ditemukan', () => {
    renderRoute('/alamat-tidak-tersedia')
    expect(screen.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeInTheDocument()
  })
  it('pencarian banner menavigasi ke daftar tugas, bukan request API palsu', async () => {
    renderRoute('/')
    await userEvent.type(screen.getByLabelText('Cari tugas berdasarkan judul atau deskripsi'), 'kata pencarian')
    await userEvent.click(screen.getByRole('button', { name: 'Cari tugas', exact: true }))
    expect(screen.getByRole('heading', { level: 1, name: 'Tugas Kami' })).toBeInTheDocument()
  })
})
