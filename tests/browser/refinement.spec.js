import { expect, test } from '@playwright/test'

// Numeric design references, not a pixel-diff. See docs/VISUAL_REFINEMENT.md.
async function measure(page, selector) {
  return page.locator(selector).evaluate(element => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      x: box.x, y: box.y, width: box.width, height: box.height,
      fontSize: parseFloat(style.fontSize), fontWeight: Number(style.fontWeight),
      lineHeight: parseFloat(style.lineHeight), fontFamily: style.fontFamily,
      paddingTop: parseFloat(style.paddingTop), paddingLeft: parseFloat(style.paddingLeft),
      paddingRight: parseFloat(style.paddingRight), borderLeft: parseFloat(style.borderLeftWidth),
    }
  })
}

function close(actual, target, label) {
  expect(Math.abs(actual - target), `${label}: target ${target}px, actual ${actual}px`).toBeLessThanOrEqual(4)
}

test('ukuran statis desktop mengikuti referensi Figma dan font dimuat', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const fonts = await page.evaluate(() => ['700 64px Oxanium', '700 24px Orbitron', '400 24px "Share Tech Mono"', '600 16px "Plus Jakarta Sans"'].map(font => ({ font, loaded: document.fonts.check(font) })))
  for (const font of fonts) expect(font.loaded, font.font).toBe(true)

  const header = await measure(page, '.site-header')
  const banner = await measure(page, '.welcome-banner')
  const title = await measure(page, '.welcome-banner h2')
  const search = await measure(page, '.banner-search input')
  const searchButton = await measure(page, '.banner-search button')
  const searchIcon = await measure(page, '.banner-search button img')
  const nav = await measure(page, '.desktop-navigation a.active')
  const task = await measure(page, '.dashboard-shared-task')
  const taskHeading = await measure(page, '.dashboard-task-heading h2')
  const teamHeading = await measure(page, '.dashboard-team h2')
  close(header.height, 100, 'header height')
  close(banner.x, 48, 'banner left')
  close(banner.y, 137, 'banner top')
  close(banner.height, 214, 'banner height')
  close(title.fontSize, 64, 'welcome font size')
  close(title.lineHeight, 70, 'welcome line height')
  expect(title.fontWeight).toBe(700)
  close(search.height, 61, 'search height')
  close(search.fontSize, 24, 'search font size')
  close(searchButton.width, 82, 'search button width')
  close(searchButton.height, 75, 'search button height')
  close(searchIcon.width, 49, 'search asset width')
  close(searchIcon.height, 49, 'search asset height')
  close(nav.fontSize, 16, 'navigation font size')
  close(nav.lineHeight, 30, 'navigation line height')
  close(task.paddingLeft + task.borderLeft, 42, 'task content inset including accent')
  close(task.paddingTop, 27, 'task top padding')
  close(taskHeading.fontSize, 40, 'task heading size')
  expect(taskHeading.fontWeight).toBe(700)
  close(teamHeading.fontSize, 40, 'team heading size')
  expect(teamHeading.fontWeight).toBe(500)
  const stripe = await page.locator('.dashboard-team').evaluate(element => {
    const style = getComputedStyle(element, '::after')
    return { height: parseFloat(style.height), gap: parseFloat(style.top) - element.getBoundingClientRect().height }
  })
  close(stripe.height, 14, 'team stripe height')
  close(stripe.gap, 8, 'team stripe gap')
  await testInfo.attach('desktop-measurements.json', { body: JSON.stringify({ fonts, header, banner, title, search, searchButton, searchIcon, nav, task, taskHeading, teamHeading, stripe }, null, 2), contentType: 'application/json' })
})

test('padding panel tidak ditimpa CSS antarrute dan form mempertahankan proporsi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  for (const [route, selector] of [['/team-progress', '.progress-panel'], ['/activity', '.activity-panel'], ['/members', '.members-panel']]) {
    await page.goto(route)
    const panel = await measure(page, selector)
    close(panel.paddingTop, 52, `${route} vertical padding`)
    close(panel.paddingLeft, 40, `${route} horizontal padding`)
  }
  await page.goto('/tasks/new')
  close((await measure(page, '.task-form-title input')).height, 65, 'title input height')
  close((await measure(page, '.task-form-description textarea')).height, 236, 'description height')
  await expect(page.locator('input[type="file"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Simpan tugas' })).toBeDisabled()
  await page.goto('/login')
  close((await measure(page, '.auth-card')).width, 915, 'login card width')
  close((await measure(page, '.auth-form input[type="password"]')).height, 74, 'login field height')
})

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`heading dan area klik tetap terbaca pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    for (const route of ['/', '/tasks/new', '/activity', '/login']) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      for (const heading of await page.locator('h1, .welcome-banner h2').all()) {
        const bounds = await heading.boundingBox()
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
        expect(await heading.evaluate(element => element.scrollWidth <= element.clientWidth + 1), route).toBe(true)
      }
      for (const button of await page.locator('.button:visible, .banner-search button:visible').all()) {
        expect((await button.boundingBox()).height, route).toBeGreaterThanOrEqual(44)
      }
    }
  })
}
