import { expect, test } from '@playwright/test'

for (const route of ['/tasks', '/activity']) {
  test(`tanggal tunggal malformed di ${route} tidak dinormalisasi oleh input native`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    const search = '?from=2026-02-30&to=not-a-date&view=compact'
    await page.goto(`${route}${search}`)
    await expect(page).toHaveURL(url => url.pathname === route && url.search === search)
    const from = page.getByLabel('Dari tanggal', { exact: true })
    const to = page.getByLabel('Sampai tanggal', { exact: true })
    for (const input of [from, to]) {
      await expect(input).toHaveValue('')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAccessibleDescription(/Tanggal pada URL tidak valid/)
    }
    await expect(to).not.toHaveAttribute('min')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await from.fill('2024-02-29')
    await expect(from).not.toHaveAttribute('aria-invalid')
    await expect(to).toHaveAttribute('min', '2024-02-29')
    await expect(to).toHaveAttribute('aria-invalid', 'true')
    expect(new URL(page.url()).searchParams.get('to')).toBe('not-a-date')
    await to.fill('2024-03-01')
    await expect(to).not.toHaveAttribute('aria-invalid')
    expect(new URL(page.url()).searchParams.get('view')).toBe('compact')
    await expect(page.locator('.feature-filters [role="alert"]')).toHaveCount(0)
    await expect(page.locator('.feature-filter-notice')).not.toContainText('Filter tidak valid')
  })
}
