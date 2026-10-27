import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1440]) {
  test(`state halaman dan konten panjang tetap aksesibel pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const apiRequests = []
    const exceptions = []
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()) })
    page.on('pageerror', error => exceptions.push(error.message))
    for (const pageName of ['tasks', 'progress', 'members', 'activity']) {
      await page.goto(`/tests/browser/fixtures/collection-states.html?page=${pageName}`)
      const main = page.locator('main')
      await expect(main.locator('.state--unavailable').first()).toBeVisible()
      await page.getByRole('button', { name: 'success', exact: true }).click()
      await expect(main).toContainText('TeksUjiPanjangTanpaSpasi')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), pageName).toBe(true)
      for (const element of await main.locator('h3, .task-card-description, .task-card-top > .feature-eyebrow, .task-card-due, .activity-list__description').all()) {
        expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${pageName}: konten tidak terpotong`).toBe(true)
      }
      await page.getByRole('button', { name: 'loading', exact: true }).click()
      await expect(main).not.toContainText('TeksUjiPanjangTanpaSpasi')
      await expect(main.getByRole('heading', { name: /Memuat/ })).toBeVisible()
      await page.getByRole('button', { name: 'error', exact: true }).click()
      const retry = main.getByRole('button', { name: 'Coba lagi' })
      await retry.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('Retry count')).toHaveText('1')
      await page.getByRole('button', { name: 'empty', exact: true }).click()
      await expect(main.locator('.state').first()).toBeVisible()
      await expect(main).not.toContainText('TeksUjiPanjangTanpaSpasi')
      await expect(main.getByRole('button', { name: 'Coba lagi' })).toHaveCount(0)
      await expect(main.getByRole('progressbar')).toHaveCount(0)
      await page.getByRole('button', { name: 'success', exact: true }).click()
      await main.getByLabel('Pencarian', { exact: true }).fill('query-lokal')
      await expect(main).not.toContainText('TeksUjiPanjangTanpaSpasi')
      await expect(main.locator('.state--unavailable').first()).toBeVisible()
      await expect(main.locator('.feature-filter-notice')).toContainText('Pencarian dan filter belum dijalankan')
    }
    expect(apiRequests).toEqual([])
    expect(exceptions).toEqual([])
  })
}
