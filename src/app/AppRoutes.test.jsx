import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

function renderRoute(route) {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>)
}
describe('Routing aplikasi', () => {
  it.each([
    ['/', 'Beranda'], ['/tasks', 'Tugas Kami'], ['/team-progress', 'Progres Tim'], ['/members', 'Anggota'], ['/activity', 'Aktivitas'], ['/tasks/new', 'Form tugas baru'], ['/tasks/unavailable/edit', 'Edit tugas'],
  ])('menampilkan %s tanpa data produksi', (route, heading) => {
    renderRoute(route)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByText(/Pratinjau antarmuka tanpa sesi/)).toBeInTheDocument()
  })
  it('login menyediakan form tanpa akun demo', () => {
    renderRoute('/login')
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
