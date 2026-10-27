import { expect, test } from '@playwright/test'

const routes = ['/', '/tasks', '/tasks/new', '/tasks/unavailable', '/tasks/unavailable/edit', '/team-progress', '/members', '/activity', '/login']
for (const width of [360, 390, 768, 1024, 1440]) {
  test(`seluruh halaman tanpa overflow pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors = []
    const apiRequests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()) })
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('.brand img')).toBeVisible()
      expect(await page.locator('.brand img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBe(true)
    }
    expect(errors).toEqual([])
    expect(apiRequests).toEqual([])
  })
}
test('menu mobile menahan fokus, mendukung Escape, dan mengembalikan fokus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Buka menu navigasi' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Navigasi workspace' })
  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole('link', { name: 'Tugas Kami', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks$/)
  await expect(dialog).not.toBeVisible()
})
test('dialog tidak ditutup oleh klik padding dan backdrop tetap menutup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Buka menu navigasi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Navigasi workspace' })
  const bounds = await dialog.boundingBox()
  await page.mouse.click(bounds.x + 4, bounds.y + 4)
  await expect(dialog).toBeVisible()
  await page.mouse.click(2, 2)
  await expect(dialog).not.toBeVisible()
})

test('profil pratinjau tidak mengarang sesi dan dapat dibuka pada mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Buka profil akun' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Profil akun' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Profil belum dapat dimuat' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Keluar', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Kelola role/status' })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('checklist baru hanya rancangan input lokal', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  await page.goto('/tasks/new')
  await page.getByRole('button', { name: 'Tambah item checklist' }).click()
  await page.getByLabel('Item checklist 1', { exact: true }).fill('Input lokal pengguna')
  await expect(page.getByRole('status').filter({ hasText: '1 item dalam rancangan lokal.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simpan tugas' })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.reload()
  await expect(page.getByLabel('Item checklist 1', { exact: true })).toHaveCount(0)
})

test('pratinjau proyek membuang rancangan dan tidak memberikan izin mutasi', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Pratinjau form proyek', exact: true })
  await trigger.click()
  let dialog = page.getByRole('dialog', { name: 'Pratinjau form proyek', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Nama proyek').fill('Input lokal pengguna')
  await expect(dialog.getByRole('button', { name: 'Simpan proyek' })).toBeDisabled()
  await expect(dialog.getByLabel('Status proyek')).toBeDisabled()
  await dialog.getByRole('button', { name: 'Tutup', exact: true }).click()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog.getByLabel('Nama proyek')).toHaveValue('')
  await page.keyboard.press('Escape')
  await page.getByText('Pratinjau struktur pengelolaan', { exact: true }).click()
  await page.getByRole('button', { name: 'Pratinjau edit proyek', exact: true }).click()
  dialog = page.getByRole('dialog', { name: /edit proyek/i })
  await expect(dialog.getByLabel('Nama proyek')).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Pratinjau konfirmasi arsip', exact: true }).click()
  dialog = page.getByRole('dialog', { name: 'Pratinjau konfirmasi arsip proyek' })
  await expect(dialog.getByRole('button', { name: 'Arsipkan proyek' })).toBeDisabled()
  await page.keyboard.press('Escape')
})

test('pratinjau pengelolaan akun tidak memilih role atau status', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  await page.goto('/members')
  const trigger = page.getByRole('button', { name: 'Pratinjau pengelolaan akun' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Pratinjau pengelolaan akun' })
  await expect(dialog).toBeVisible()
  for (const select of await dialog.getByRole('combobox').all()) {
    await expect(select).toBeDisabled()
    await expect(select).toHaveValue('')
  }
  await expect(dialog.getByRole('button', { name: /Simpan/ })).toBeDisabled()
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('dialog proyek mobile dapat digulir sampai aksi dan menahan fokus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Pratinjau form proyek', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Pratinjau form proyek', exact: true })
  await dialog.getByLabel('Deskripsi proyek').fill('Input lokal panjang. '.repeat(80))
  expect(await dialog.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  for (const key of ['Tab', 'Shift+Tab', 'Tab', 'Tab']) {
    await page.keyboard.press(key)
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  const close = dialog.getByRole('button', { name: 'Tutup', exact: true })
  await close.scrollIntoViewIfNeeded()
  await expect(close).toBeInViewport()
  expect(await dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await close.click()
  await expect(trigger).toBeFocused()
})

test('referensi detail panjang tidak mengarang data atau meluapkan layar', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  const reference = 'referensi-lokal-'.repeat(30)
  await page.goto(`/tasks/${reference}`)
  await expect(page.locator('.task-reference code')).toHaveText(reference)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  for (const name of ['Edit tugas', 'Arsipkan tugas', 'Tambah checklist']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
  }
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await expect(page.getByRole('checkbox')).toHaveCount(0)
})

test('ikon pencarian tidak bertumpuk dengan input', async ({ page }) => {
  await page.goto('/tasks')
  const input = page.getByRole('searchbox', { name: 'Pencarian' })
  const padding = await input.evaluate(element => parseFloat(getComputedStyle(element).paddingLeft))
  const icon = await page.locator('.feature-filter-search > svg').boundingBox()
  const bounds = await input.boundingBox()
  expect(bounds.x + padding).toBeGreaterThan(icon.x + icon.width)
})

test('pencarian URL dan reset tidak membuat hasil palsu', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Cari tugas berdasarkan judul atau deskripsi').fill('kata pencarian')
  await page.getByRole('button', { name: 'Cari tugas', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks\?q=kata%20pencarian$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tugas Kami' })).toBeVisible()
  await expect(page.getByText('Daftar tugas belum dapat dimuat')).toBeVisible()
  await page.getByRole('button', { name: 'Reset filter' }).click()
  await expect(page).toHaveURL(/\/tasks$/)
})
test('fokus route tidak menggulir header keluar layar dan skip link muncul saat keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/tasks/new')
  await expect(page.locator('main')).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  const skip = page.getByRole('link', { name: 'Lewati ke konten utama' })
  expect(await skip.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0)
  await skip.focus()
  expect(await skip.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0)
})
test('login dan penyimpanan belum aktif tanpa kontrak backend', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Masuk belum tersedia' })).toBeDisabled()
  await expect(page.getByLabel('Password')).toBeDisabled()
  await page.goto('/tasks/new')
  await expect(page.getByRole('button', { name: /Simpan/ })).toBeDisabled()
})
