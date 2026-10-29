import { expect, test } from '@playwright/test'

const writes = new WeakMap()
test.beforeEach(async ({ page }) => {
  const requests = []
  writes.set(page, requests)
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/') && request.method() !== 'GET') requests.push(`${request.method()} ${request.url()}`)
  })
  await page.route('**/api/auth/me', route => route.request().method() === 'GET' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.fallback())
  await page.route('**/api/tasks', route => route.request().method() === 'GET' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.fallback())
})
test.afterEach(async ({ page }) => {
  expect(writes.get(page), 'pratinjau tidak mengirim mutasi API').toEqual([])
})

async function expectLoginFocus(page, previousScrollY = 0) {
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('#login-main')).toBeFocused()
  await expect(page.locator('#login-main')).toHaveAttribute('tabindex', '-1')
  const scroll = await page.evaluate(() => ({ y: window.scrollY, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }))
  expect(scroll.y).toBe(Math.min(previousScrollY, scroll.max))
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
  await expect(page.getByLabel('Password', { exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled()
  await expect(page.getByRole('status')).toContainText('Autentikasi tersedia')
}

for (const entry of ['profil', 'status']) {
  test(`navigasi login desktop dari ${entry} memindahkan fokus tanpa menggulir`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    const session = page.getByRole('complementary', { name: 'Status sesi' })
    await expect(session).toContainText('Layanan autentikasi tidak tersedia.')
    let link = session.getByRole('link', { name: 'Masuk', exact: true })
    if (entry === 'profil') {
      await page.getByRole('button', { name: 'Buka profil akun' }).focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Profil akun' })
      await expect(dialog).toBeVisible()
      link = dialog.getByRole('link', { name: 'Halaman masuk', exact: true })
    }
    await link.focus()
    const previousScrollY = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('Enter')
    await expectLoginFocus(page, previousScrollY)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

test('navigasi login mobile meninggalkan dialog dan memfokuskan konten login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Buka menu navigasi' }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Navigasi workspace' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('link', { name: 'Halaman masuk', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expectLoginFocus(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const width of [390, 1440]) {
  test(`skip link login dapat dicapai dan diaktifkan dengan keyboard pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/login')
    await expectLoginFocus(page)
    const skip = page.getByRole('link', { name: 'Lewati ke konten utama' })
    expect(await skip.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0)
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('link', { name: 'FlexBoard — beranda' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(skip).toBeFocused()
    expect(await skip.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0)
    await page.keyboard.press('Enter')
    await expect(page.locator('#login-main')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Kembali', exact: true })).toBeFocused()
  })
}

test('hapus checklist lokal dengan keyboard memfokuskan item berikut, sebelumnya, lalu tombol tambah', async ({ page }) => {
  await page.goto('/tasks/new')
  const add = page.getByRole('button', { name: 'Tambah item checklist', exact: true })
  for (const [index, value] of ['Rancangan pertama', 'Rancangan kedua', 'Rancangan ketiga'].entries()) {
    await add.focus()
    await page.keyboard.press('Enter')
    const input = page.getByLabel(`Item checklist ${index + 1}`, { exact: true })
    await expect(input).toBeFocused()
    await input.fill(value)
  }
  await page.getByLabel('Item checklist 2', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Hapus item checklist 2', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Item checklist 2', { exact: true })).toBeFocused()
  await expect(page.getByLabel('Item checklist 2', { exact: true })).toHaveValue('Rancangan ketiga')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Item checklist 1', { exact: true })).toBeFocused()
  await expect(page.getByLabel('Item checklist 1', { exact: true })).toHaveValue('Rancangan pertama')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(add).toBeFocused()
  await expect(page.getByRole('textbox', { name: /^Item checklist/ })).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: '0 item dalam rancangan lokal.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simpan tugas', exact: true })).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('textbox', { name: /^Item checklist/ })).toHaveCount(0)
})

for (const route of ['/tasks', '/activity']) {
  test(`tanggal URL rusak di ${route} tetap terlihat sebagai kesalahan dan dapat diperbaiki`, async ({ page }) => {
    const query = '?from=2026-02-30&from=2026-10-01&to=not-a-date&to=2026-10-31&q=rancangan&view=compact'
    await page.goto(`${route}${query}`)
    await expect(page).toHaveURL(url => url.pathname === route && url.search === query)
    const from = page.getByLabel('Dari tanggal', { exact: true })
    const to = page.getByLabel('Sampai tanggal', { exact: true })
    for (const input of [from, to]) {
      await expect(input).toHaveValue('')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAccessibleDescription(/\S/)
    }
    expect(await to.getAttribute('min')).toBeNull()
    await expect(page.locator('.feature-filter-notice')).toContainText('Filter tidak valid')
    await from.fill('2026-10-10')
    await expect(from).not.toHaveAttribute('aria-invalid', 'true')
    await expect(to).toHaveAttribute('min', '2026-10-10')
    let params = new URL(page.url()).searchParams
    expect(params.getAll('from')).toEqual(['2026-10-10'])
    expect(params.getAll('to')).toEqual(['not-a-date', '2026-10-31'])
    await to.fill('2026-10-20')
    await expect(to).not.toHaveAttribute('aria-invalid', 'true')
    params = new URL(page.url()).searchParams
    expect(params.getAll('from')).toEqual(['2026-10-10'])
    expect(params.getAll('to')).toEqual(['2026-10-20'])
    expect(params.get('q')).toBe('rancangan')
    expect(params.get('view')).toBe('compact')
    await expect(page.locator('.feature-filters [role="alert"]')).toHaveCount(0)
  })

  test(`reset tanggal URL rusak di ${route} membersihkan kesalahan tanpa menghapus parameter lain`, async ({ page }) => {
    await page.goto(`${route}?from=not-a-date&from=2026-10-01&to=2026-13-01&to=2026-10-31&q=rancangan&view=compact`)
    await expect(page.getByLabel('Dari tanggal', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Sampai tanggal', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    const reset = page.getByRole('button', { name: 'Reset filter', exact: true })
    await reset.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${route}?view=compact`)
    for (const name of ['Dari tanggal', 'Sampai tanggal']) {
      const input = page.getByLabel(name, { exact: true })
      await expect(input).toHaveValue('')
      await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    }
    expect(await page.getByLabel('Sampai tanggal', { exact: true }).getAttribute('min')).toBeNull()
    await expect(page.locator('.feature-filters [role="alert"]')).toHaveCount(0)
    await expect(reset).toBeDisabled()
  })
}
