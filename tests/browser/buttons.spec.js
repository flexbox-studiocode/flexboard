import { expect, test } from '@playwright/test'
import { waitForFonts } from './waitForFonts.js'

async function ready(page, path = '/') {
  await page.route('**/api/**', async route => {
    expect(route.request().method()).toBe('GET')
    await route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(path)
  await waitForFonts(page)
}

for (const width of [320, 390, 768, 850, 851, 1024, 1440]) {
  test(`tombol proyek sejajar dengan kontrol, bukan teks bantuan pada ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await ready(page)
    const picker = page.locator('.project-picker')
    const select = picker.getByLabel('Proyek', { exact: true })
    const button = picker.getByRole('button', { name: 'Buat proyek', exact: true })
    await button.scrollIntoViewIfNeeded()
    const fieldBox = await select.boundingBox()
    const buttonBox = await button.boundingBox()
    expect(fieldBox.height).toBe(48)
    expect(buttonBox.height).toBe(48)
    if (buttonBox.x >= fieldBox.x + fieldBox.width) {
      expect(Math.abs(fieldBox.y - buttonBox.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(fieldBox.y + fieldBox.height - buttonBox.y - buttonBox.height)).toBeLessThanOrEqual(1)
    } else {
      expect(buttonBox.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height)
    }
    const hint = page.locator(`[id="${await select.getAttribute('aria-describedby')}"]`)
    await expect(hint).toHaveText('Proyek aktif yang dapat Anda akses.')
    expect((await hint.boundingBox()).y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height)
    expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await testInfo.attach(`project-button-${width}.png`, { body: await picker.screenshot(), contentType: 'image/png' })
    await button.click()
    const dialog = page.getByRole('dialog', { name: 'Buat proyek', exact: true })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })
}

for (const width of [320, 390, 851, 1024, 1440]) {
  test(`tombol hapus checklist mengikuti tinggi dan pusat input pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await ready(page, '/tasks/new')
    await page.getByRole('button', { name: 'Tambah item checklist', exact: true }).click()
    const input = page.getByLabel('Item checklist 1', { exact: true })
    const remove = page.getByRole('button', { name: 'Hapus item checklist 1', exact: true })
    const inputBox = await input.boundingBox()
    const buttonBox = await remove.boundingBox()
    expect(buttonBox.height).toBeCloseTo(inputBox.height, 0)
    expect(buttonBox.y).toBeCloseTo(inputBox.y, 0)
    expect(buttonBox.width).toBeGreaterThanOrEqual(44)
    await remove.click()
    await expect(page.getByRole('button', { name: 'Tambah item checklist', exact: true })).toBeFocused()
  })
}

for (const width of [320, 390]) {
  test(`reset filter memiliki baris sendiri tanpa offset label pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await ready(page, '/activity?from=2026-10-29&to=2026-10-01')
    const reset = page.getByRole('button', { name: 'Reset filter', exact: true })
    const resetBox = await reset.boundingBox()
    const field = page.getByLabel('Sampai tanggal', { exact: true }).locator('..')
    const fieldBox = await field.boundingBox()
    expect(resetBox.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height)
    expect(await reset.evaluate(element => getComputedStyle(element).marginTop)).toBe('0px')
    expect(resetBox.height).toBe(48)
    await reset.click()
    await expect(page).toHaveURL(/\/activity$/)
  })
  test(`aksi form tersusun tanpa tombol membesar karena teks terbungkus pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await ready(page, '/tasks/new')
    const actions = page.locator('.task-form-actions')
    for (const action of await actions.locator('.button').all()) {
      expect(await action.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }
  })
}

test('tombol pada halaman tidak terpotong serta tetap memiliki target aksesibel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page)
  for (const path of ['/', '/tasks', '/tasks/new', '/team-progress', '/members', '/activity', '/login']) {
    await page.goto(path)
    await waitForFonts(page)
    for (const button of await page.locator('button:visible, a.button:visible').all()) {
      const box = await button.boundingBox()
      expect(box.height, `${path}: ${await button.textContent()}`).toBeGreaterThanOrEqual(44)
      expect(box.width, path).toBeGreaterThanOrEqual(44)
      expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth + 1), path).toBe(true)
      expect(box.x, path).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, path).toBeLessThanOrEqual(391)
    }
  }
})
