import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
    cleanup()
    vi.unstubAllGlobals()
  })
  it.each([
    ['/', 'Beranda', []], ['/tasks', 'Tugas Kami', ['/api/tasks']], ['/team-progress', 'Progres Tim', ['/api/progress/team']], ['/members', 'Anggota', ['/api/members']], ['/activity', 'Aktivitas', ['/api/activity']], ['/tasks/new', 'Form tugas baru', ['/api/projects', '/api/members']], ['/tasks/unavailable/edit', 'Edit tugas', ['/api/projects', '/api/members', '/api/tasks/unavailable']],
  ])('menampilkan %s tanpa sesi dan menangani API yang menolak akses', async (route, heading, domainPaths) => {
    renderRoute(route)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(await screen.findByText('Belum masuk')).toBeInTheDocument()
    const session = within(screen.getByRole('complementary', { name: 'Status sesi' }))
    expect(await session.findByText('Belum ada sesi aktif.')).toBeInTheDocument()
    expect(session.getByRole('link', { name: 'Masuk', exact: true })).toHaveAttribute('href', '/login')
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' })
    for (const path of domainPaths) expect(fetch).toHaveBeenCalledWith(path, { credentials: 'include', headers: { 'content-type': 'application/json' } })
    expect(fetch.mock.calls.map(([path]) => path).sort()).toEqual(['/api/auth/me', ...domainPaths].sort())
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
  it('pencarian banner menavigasi ke daftar tugas dan memuat API tugas', async () => {
    renderRoute('/')
    await userEvent.type(screen.getByLabelText('Cari tugas berdasarkan judul atau deskripsi'), 'kata pencarian')
    await userEvent.click(screen.getByRole('button', { name: 'Cari tugas', exact: true }))
    expect(screen.getByRole('heading', { level: 1, name: 'Tugas Kami' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/tasks', { credentials: 'include', headers: { 'content-type': 'application/json' } }))
    expect(fetch.mock.calls.every(([path]) => ['/api/auth/me', '/api/tasks'].includes(path))).toBe(true)
  })
})
