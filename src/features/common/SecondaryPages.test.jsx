import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import TeamProgressPage from '../progress/TeamProgressPage.jsx'
import MembersPage from '../members/MembersPage.jsx'
import ActivityPage from '../activity/ActivityPage.jsx'

const longName = 'Anggota dengan nama sangat panjang untuk pengujian tampilan koleksi sesuai cakupan'
const pages = [
  {
    name: 'Progres tim', Component: TeamProgressPage, prop: 'progress', path: '/team-progress',
    unavailable: 'Progres tim belum dapat dimuat', empty: 'Belum ada progres anggota',
    loading: 'Memuat progres tim', error: 'Progres tim gagal dimuat', list: '.member-progress-list',
    items: [{ id: 'progress-1', name: longName, roleLabel: 'Penanggung jawab proyek', projectLabel: 'Proyek dari server', progress: 0, averageProgress: 0, detailPath: '/tasks/server-task' }],
  },
  {
    name: 'Anggota', Component: MembersPage, prop: 'members', path: '/members',
    unavailable: 'Daftar anggota belum dapat dimuat', empty: 'Belum ada anggota',
    loading: 'Memuat daftar anggota', error: 'Daftar anggota gagal dimuat', list: '.feature-stats',
    items: [{ id: 'member-1', name: longName, roleLabel: 'Penanggung jawab proyek', statusLabel: 'Status dari server', activeTaskCount: 0, progress: 0 }],
  },
  {
    name: 'Aktivitas', Component: ActivityPage, prop: 'activity', path: '/activity',
    unavailable: 'Riwayat belum tersedia', empty: 'Belum ada aktivitas',
    loading: 'Memuat aktivitas', error: 'Aktivitas gagal dimuat', list: '.activity-list',
    items: [{ id: 'activity-1', actorLabel: longName, actionLabel: 'memperbarui', objectLabel: 'Tugas dari server', objectPath: '/tasks/server-task', projectLabel: 'Proyek dari server', timeLabel: 'Waktu dari server', dateTime: '2026-10-27T09:00:00Z', description: 'Catatan dari server' }],
  },
]

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <output data-testid="scope">{pathname}{search}</output>
}

function renderPage(page, resource, initialEntry = page.path) {
  const { Component, prop } = page
  const tree = value => <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Component {...{ [prop]: value }} />
    <LocationProbe />
  </MemoryRouter>
  const view = render(tree(resource))
  return { ...view, update: value => view.rerender(tree(value)) }
}

function expectNoRows(container, page) {
  expect(container.querySelector(page.list)).not.toBeInTheDocument()
  expect(screen.queryByText(longName, { exact: true })).not.toBeInTheDocument()
}

describe.each(pages)('$name scoped collection', page => {
  it('keeps the original unavailable state without a resource or pagination', () => {
    const { container } = renderPage(page)
    const state = screen.getByRole('heading', { name: page.unavailable }).parentElement
    expect(state).toHaveClass('state--unavailable')
    expect(state.parentElement).toHaveClass('panel')
    expectNoRows(container, page)
    expect(screen.queryByRole('button', { name: /berikutnya|sebelumnya/i })).not.toBeInTheDocument()
    if (page.prop === 'progress') expect(screen.getByText('Data belum tersedia')).toBeInTheDocument()
  })

  it('renders loading, optional retry errors, confirmed empty and successful collections', () => {
    const { container, update } = renderPage(page, { status: 'loading', scope: page.path, items: page.items })
    expect(screen.getByRole('heading', { name: page.loading }).parentElement).toHaveAttribute('role', 'status')
    expectNoRows(container, page)
    expect(screen.queryByText('Data belum tersedia', { exact: true })).not.toBeInTheDocument()

    update({ status: 'error', scope: page.path, items: page.items, error: 'PRIVATE_SERVER_ERROR' })
    expect(screen.getByRole('heading', { name: page.error }).parentElement).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
    expect(screen.queryByText('PRIVATE_SERVER_ERROR')).not.toBeInTheDocument()
    expectNoRows(container, page)

    update({ status: 'success', scope: page.path, items: [] })
    expect(screen.getByRole('heading', { name: page.empty })).toBeInTheDocument()
    expect(screen.queryByText('Data belum tersedia', { exact: true })).not.toBeInTheDocument()
    expectNoRows(container, page)

    update({ status: 'success', scope: page.path, items: page.items })
    expect(screen.getByText(longName, { exact: true })).toBeInTheDocument()
    expect(container.querySelector(page.list)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: page.unavailable })).not.toBeInTheDocument()
    expect(screen.queryByText('Data belum tersedia', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /berikutnya|sebelumnya/i })).not.toBeInTheDocument()
  })

  it('activates an optional retry callback using the keyboard', async () => {
    const onRetry = vi.fn()
    const { update } = renderPage(page, { status: 'error', scope: page.path, onRetry })
    const retry = screen.getByRole('button', { name: 'Coba lagi' })
    retry.focus()
    expect(retry).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    expect(onRetry).toHaveBeenCalledTimes(2)
    update({ status: 'error', scope: page.path, onRetry: 'not-a-function' })
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
  })

  it.each(['loading', 'error'])('removes previously successful rows immediately on %s', status => {
    const { container, update } = renderPage(page, { status: 'success', scope: page.path, items: page.items })
    expect(screen.getByText(longName, { exact: true })).toBeInTheDocument()
    update({ status, scope: page.path, items: page.items })
    expect(screen.getByRole('heading', { name: page[status] })).toBeInTheDocument()
    expectNoRows(container, page)
  })

  it('hides old rows after local query changes until the exact scope receives new data', () => {
    const { container, update } = renderPage(page, { status: 'success', scope: page.path, items: page.items })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Pencarian' }), { target: { value: 'anggota' } })
    const scope = `${page.path}?q=anggota`
    expect(screen.getByTestId('scope')).toHaveTextContent(scope)
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    expectNoRows(container, page)
    expect(screen.getByText('Pilihan tersimpan di URL. Pencarian dan filter belum dijalankan karena layanan data belum terhubung.')).toBeInTheDocument()

    update({ status: 'loading', scope: page.path })
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    update({ status: 'error', scope: page.path, onRetry: vi.fn() })
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
    update({ status: 'success', scope, items: page.items })
    expect(screen.getByText(longName, { exact: true })).toBeInTheDocument()
    // The toolbar remains a local URL control, not a claim of server filtering.
    expect(screen.getByText('Pilihan tersimpan di URL. Pencarian dan filter belum dijalankan karena layanan data belum terhubung.')).toBeInTheDocument()
  })

  it('requires exact pathname and query serialization, not equivalent parameters', () => {
    const scope = `${page.path}?view=list&q=anggota`
    const { container, update } = renderPage(page, { status: 'success', scope: `${page.path}?q=anggota&view=list`, items: page.items }, scope)
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    expectNoRows(container, page)
    update({ status: 'success', scope: `/another?view=list&q=anggota`, items: page.items })
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    update({ status: 'success', scope, items: page.items })
    expect(screen.getByText(longName, { exact: true })).toBeInTheDocument()
  })

  it('fails closed for unknown status, missing scope and malformed success', () => {
    const { container, update } = renderPage(page, { status: 'unknown', scope: page.path, items: page.items })
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    expectNoRows(container, page)
    update({ status: 'success', items: page.items })
    expect(screen.getByRole('heading', { name: page.unavailable })).toBeInTheDocument()
    for (const items of [undefined, null, {}, 'not-an-array']) {
      update({ status: 'success', scope: page.path, items })
      expect(screen.getByRole('heading', { name: page.error })).toBeInTheDocument()
      expectNoRows(container, page)
    }
  })
})

describe('server-derived measurements in secondary pages', () => {
  it('distinguishes unknown progress and averages from zero in the progress list', () => {
    const page = pages[0]
    const { container } = renderPage(page, { status: 'success', scope: page.path, items: [
      { id: 'unknown', name: 'Progres tidak diketahui', progress: null, averageProgress: null },
      { id: 'zero', name: longName, progress: 0, averageProgress: 0 },
    ] })
    const [unknown, zero] = container.querySelectorAll('.member-progress-list > li')
    expect(within(unknown).queryByRole('progressbar')).not.toBeInTheDocument()
    expect(within(unknown).getByText('Belum tersedia')).toBeInTheDocument()
    expect(unknown.querySelector('.member-progress-list__average strong')).toHaveTextContent('—')
    expect(within(zero).getByRole('progressbar', { name: `Progres ${longName}` })).toHaveAttribute('value', '0')
    expect(zero.querySelector('.member-progress-list__average strong')).toHaveTextContent('0%')
  })

  it('distinguishes unknown task counts and progress from zero in member cards', () => {
    const page = pages[1]
    const { container } = renderPage(page, { status: 'success', scope: page.path, items: [
      { id: 'unknown', name: 'Anggota tanpa pengukuran', activeTaskCount: null, progress: null },
      { id: 'zero', name: longName, activeTaskCount: 0, progress: 0 },
    ] })
    const [unknown, zero] = container.querySelectorAll('.member-card')
    expect(within(unknown).getByText('Tugas aktif').nextElementSibling).toHaveTextContent('—')
    expect(within(unknown).queryByRole('progressbar')).not.toBeInTheDocument()
    expect(within(unknown).getByText('Belum tersedia')).toBeInTheDocument()
    expect(within(zero).getByText('Tugas aktif').nextElementSibling).toHaveTextContent('0')
    expect(within(zero).getByRole('progressbar', { name: 'Progres pekerjaan' })).toHaveAttribute('value', '0')
    expect(within(zero).getByRole('heading', { name: longName })).toBeInTheDocument()
  })

  it('renders activity labels, links and timestamps without generating missing values', () => {
    const page = pages[2]
    const { container } = renderPage(page, { status: 'success', scope: page.path, items: [
      ...page.items,
      { id: 'without-time', actorLabel: 'Aktor lain', actionLabel: 'mencatat', objectLabel: 'Objek tanpa waktu' },
    ] })
    const [complete, partial] = container.querySelectorAll('.activity-list > li')
    expect(within(complete).getByRole('link', { name: 'Tugas dari server' })).toHaveAttribute('href', '/tasks/server-task')
    expect(within(complete).getByText('Waktu dari server')).toHaveAttribute('datetime', '2026-10-27T09:00:00Z')
    expect(within(complete).getByText('Catatan dari server')).toBeInTheDocument()
    expect(partial.querySelector('time')).not.toBeInTheDocument()
    expect(partial.querySelector('.activity-list__time')).not.toBeInTheDocument()
  })
})
