import { expect, test } from '@playwright/test'

const screens = [
  ['beranda', '/', 'Beranda'],
  ['tugas', '/tasks', 'Tugas Kami'],
  ['tambah-tugas', '/tasks/new', null],
  ['detail-tugas', '/tasks/unavailable', null],
  ['edit-tugas', '/tasks/unavailable/edit', null],
  ['progres', '/team-progress', 'Progres Tim'],
  ['anggota', '/members', 'Anggota'],
  ['aktivitas', '/activity', null],
  ['login', '/login', null],
  ['not-found', '/not-found', null],
]

for (const width of [390, 1440]) {
  test(`rekam seluruh halaman hasil penyelarasan pada ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    for (const [name, route, heading] of screens) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('h1')).toHaveCount(1)
      if (heading) await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true)
      for (const image of await page.locator('img:visible').all()) {
        expect(await image.evaluate(element => element.complete && element.naturalWidth > 0), `${route}: aset lokal dimuat`).toBe(true)
        expect(await image.getAttribute('src')).not.toContain('figma.com/api/mcp/asset')
        const bounds = await image.boundingBox()
        expect(bounds.width).toBeGreaterThan(0)
        expect(bounds.height).toBeGreaterThan(0)
        expect(bounds.width / bounds.height).toBeGreaterThan(.8)
        expect(bounds.width / bounds.height).toBeLessThan(1.2)
      }
      const screenshot = testInfo.outputPath(`${name}-${width}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      await testInfo.attach(`${name}-${width}`, { path: screenshot, contentType: 'image/png' })
    }
  })
}

test('hierarki Beranda dan navigasi mengikuti komposisi yang disepakati', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const geometry = await page.evaluate(() => {
    const selectors = ['.welcome-banner', '.page-header', '.dashboard-shared-task', '.dashboard-team', '.dashboard-activity']
    return selectors.map(selector => document.querySelector(selector).getBoundingClientRect().top)
  })
  expect(geometry).toEqual([...geometry].sort((a, b) => a - b))
  await expect(page.locator('.feature-stats')).toHaveCount(0)
  await expect(page.locator('.dashboard-shared-task')).toHaveCSS('background-color', 'rgb(35, 43, 54)')
  await expect(page.locator('.dashboard-team')).toHaveCSS('background-color', 'rgb(59, 119, 178)')
  await expect(page.getByRole('button', { name: 'Tambah tugas', exact: true })).toBeDisabled()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  const banner = page.locator('.welcome-banner').boundingBox()
  const notice = page.locator('.integration-notice').boundingBox()
  expect((await notice).y).toBeGreaterThan((await banner).y)
  await page.goto('/activity')
  await expect(page.locator('.desktop-navigation a.active')).toHaveText('Aktivitas')
  await page.goto('/not-found')
  await expect(page.locator('.desktop-navigation a.active')).toHaveCount(0)
})
