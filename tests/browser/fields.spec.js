import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1440]) {
  test(`kontrol filter seragam dan chevron memiliki ruang pada ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    let reference
    for (const route of ['/tasks', '/team-progress', '/activity', '/members']) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const controls = await page.locator('.feature-filters input, .feature-filters select').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        const label = element.closest('.field').querySelector('label').getBoundingClientRect()
        return { type: element.tagName, height: box.height, font: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight, radius: style.borderRadius, paddingLeft: style.paddingLeft, labelGap: box.top - label.bottom }
      }))
      for (const control of controls) {
        reference ??= control
        expect(control.height, route).toBe(48)
        expect(control.font, route).toBe(reference.font)
        expect(control.size, route).toBe('16px')
        expect(control.lineHeight, route).toBe('24px')
        expect(control.radius, route).toBe(reference.radius)
        expect(control.labelGap, route).toBe(8)
      }
      const chevrons = await page.locator('.field__control--select').evaluateAll(elements => elements.map(element => {
        const select = element.querySelector('select')
        const icon = element.querySelector('.field__chevron')
        const box = select.getBoundingClientRect()
        const iconBox = icon.getBoundingClientRect()
        return { inset: box.right - iconBox.right, reserved: parseFloat(getComputedStyle(select).paddingRight), pointerEvents: getComputedStyle(icon).pointerEvents }
      }))
      for (const chevron of chevrons) {
        expect(chevron.inset, route).toBeGreaterThanOrEqual(15)
        expect(chevron.reserved, route).toBeGreaterThanOrEqual(48)
        expect(chevron.pointerEvents).toBe('none')
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true)
      if (route === '/tasks' || route === '/activity') {
        const path = testInfo.outputPath(`${route.slice(1)}-filters-${width}.png`)
        await page.locator('.feature-filters').screenshot({ path })
        await testInfo.attach(`${route}-filters`, { path, contentType: 'image/png' })
      }
    }
    await page.goto('/tasks/new')
    await expect(page.locator('select[multiple] + .field__chevron')).toHaveCount(0)
    for (const wrapper of await page.locator('.field__control--select').all()) {
      const padding = await wrapper.locator('select').evaluate(element => parseFloat(getComputedStyle(element).paddingRight))
      expect(padding).toBeGreaterThanOrEqual(48)
    }
  })
}

test('rentang tanggal invalid tidak menggeser baris kontrol', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/tasks?from=2026-10-27&to=2026-10-01')
  const tops = await page.locator('.feature-filter-options select, .feature-filter-options input').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)
  await expect(page.getByLabel('Dari tanggal')).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Reset filter' }).click()
  await expect(page.getByLabel('Dari tanggal')).toHaveValue('')
})
