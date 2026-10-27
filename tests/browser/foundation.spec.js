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
test('login dan penyimpanan belum aktif tanpa kontrak backend', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Masuk belum tersedia' })).toBeDisabled()
  await expect(page.getByLabel('Password')).toBeDisabled()
  await page.goto('/tasks/new')
  await expect(page.getByRole('button', { name: /Simpan/ })).toBeDisabled()
})
