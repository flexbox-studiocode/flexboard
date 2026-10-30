import { expect, test } from '@playwright/test'
import { waitForFonts } from './waitForFonts.js'

// Layout intent and CSS-pixel bounds, not pixel-perfect screenshot comparisons.
// API fixtures are read-only; these tests must never persist domain changes.
const longName = 'Administrator FlexBoard dengan nama akun yang sangat panjang tanpa kehilangan navigasi'

async function mockReadOnlyApi(page, authenticated = false) {
  await page.route('**/api/**', async route => {
    const request = route.request()
    if (request.method() !== 'GET') {
      await route.abort('blockedbyclient')
      throw new Error(`Density test attempted a write: ${request.method()} ${request.url()}`)
    }
    const path = new URL(request.url()).pathname
    if (path === '/api/auth/me') {
      await route.fulfill({ status: authenticated ? 200 : 401, json: authenticated
        ? { data: { user: { id: 'density-admin', role: 'admin', displayName: longName, email: 'density-admin@example.test' }, capabilities: {} } }
        : { error: { code: 'UNAUTHENTICATED' } } })
      return
    }
    const data = path === '/api/projects' ? { projects: [] } : path === '/api/members' ? { members: [] } : { tasks: [] }
    await route.fulfill({ status: 200, json: { data } })
  })
}

async function ready(page, route) {
  await page.goto(route)
  await waitForFonts(page)
}

async function assertLayout(page, width, route) {
  const global = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body
    return {
      viewport: document.querySelector('meta[name="viewport"]')?.content,
      rootSize: getComputedStyle(root).fontSize,
      overflow: Math.max(root.scrollWidth, body.scrollWidth) - innerWidth,
      scaling: [root, body].map(element => {
        const style = getComputedStyle(element)
        return { zoom: style.zoom, transform: style.transform, scale: style.scale }
      }),
    }
  })
  expect(global.viewport).toContain('width=device-width')
  expect(global.viewport).toContain('initial-scale=1')
  expect(global.viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/)
  expect(global.rootSize, route).toBe('16px')
  expect(global.overflow, `${route}: horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
  for (const style of global.scaling) {
    expect(['1', 'normal']).toContain(style.zoom)
    expect(style.transform).toBe('none')
    expect(['none', '1']).toContain(style.scale)
  }
  for (const heading of await page.locator('h1:visible, h2:visible').all()) {
    const box = await heading.boundingBox()
    expect(box.x, route).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width, route).toBeLessThanOrEqual(width + 1)
    const text = await heading.evaluate(element => ({ size: parseFloat(getComputedStyle(element).fontSize), fits: element.scrollWidth <= element.clientWidth + 1 }))
    expect(text.fits, route).toBe(true)
    expect(text.size, `${route}: heading cap`).toBeLessThanOrEqual(width >= 851 ? 44 : 64)
  }
  // Native checkboxes are not present in these forms. Check visible action and field targets.
  const controls = page.locator('button:visible, .button:visible, .banner-search input:visible, .field input:visible, .field select:visible, .field textarea:visible')
  expect(await controls.count(), route).toBeGreaterThan(0)
  for (const control of await controls.all()) {
    const box = await control.boundingBox()
    expect(box.height, `${route}: ${await control.getAttribute('name') || await control.textContent()}`).toBeGreaterThanOrEqual(44)
    expect(box.width, `${route}: target width`).toBeGreaterThanOrEqual(44)
  }
}

for (const [width, height] of [[851, 900], [1024, 768], [1199, 900], [1200, 900], [1280, 720], [1440, 900], [1920, 1080], [320, 800], [390, 844], [768, 1024], [850, 900]]) {
  test(`kepadatan dan reflow ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockReadOnlyApi(page)
    for (const route of ['/', '/tasks/new', '/login']) {
      await ready(page, route)
      await assertLayout(page, width, route)
      if (route === '/' && width >= 851) {
        const welcomeSize = await page.locator('.welcome-banner h2').evaluate(element => parseFloat(getComputedStyle(element).fontSize))
        expect(welcomeSize).toBeCloseTo(Math.min(44, Math.max(32, width * 0.03)), 1)
        if (width === 1280) expect((await page.locator('.dashboard-shared-task').boundingBox()).y).toBeLessThanOrEqual(460)
      }
      if (route === '/' && [1280, 1440, 390].includes(width)) {
        await testInfo.attach(`dashboard-${width}x${height}.png`, { body: await page.screenshot(), contentType: 'image/png' })
      }
    }
  })
}

for (const width of [390, 851, 1024, 1200, 1440]) {
  test(`nama admin panjang tidak mendorong navigasi pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockReadOnlyApi(page, true)
    await ready(page, '/')
    await expect(page.locator('.header-account strong')).toHaveText(longName)
    await expect(page.locator('.header-account > div > span')).toHaveText('admin')
    await assertLayout(page, width, '/')
    const header = page.locator('.site-header__inner')
    expect(await header.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    const profile = page.getByRole('button', { name: 'Buka profil akun' })
    const profileBox = await profile.boundingBox()
    expect(profileBox.x + profileBox.width).toBeLessThanOrEqual(width)
    const accountName = page.locator('.header-account strong')
    if (await accountName.isVisible()) {
      expect(await accountName.evaluate(element => element.clientWidth > 0)).toBe(true)
    }
    if (width >= 851) {
      await expect(page.locator('.desktop-navigation')).toBeVisible()
      const nav = await page.locator('.desktop-navigation').boundingBox()
      const account = await page.locator('.header-account').boundingBox()
      expect(nav.x + nav.width).toBeLessThanOrEqual(account.x + 1)
      await expect(page.getByRole('link', { name: 'Aktivitas', exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Buka menu navigasi' })).toBeVisible()
    }
  })
}

for (const width of [851, 1024, 1440]) {
  test(`baris koleksi berisi tetap ringkas dan teks panjang utuh pada ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const apiRequests = []
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
    })
    for (const [pageName, selector] of [['progress', '.member-progress-list > li'], ['activity', '.activity-list > li']]) {
      await ready(page, `/tests/browser/fixtures/collection-states.html?page=${pageName}`)
      await page.getByRole('button', { name: 'success', exact: true }).click()
      const rows = page.locator(`main ${selector}`)
      await expect(rows).toHaveCount(1)
      await expect(rows.first()).toContainText('TeksUjiPanjangTanpaSpasi')
      const metrics = await rows.first().evaluate(element => {
        const style = getComputedStyle(element)
        return { minHeight: style.minHeight, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, clipped: element.scrollWidth > element.clientWidth + 1 }
      })
      expect(metrics.minHeight, pageName).toBe('112px')
      expect(metrics.paddingTop, pageName).toBe('20px')
      expect(metrics.paddingBottom, pageName).toBe('20px')
      expect(metrics.clipped, pageName).toBe(false)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), pageName).toBe(true)
      for (const content of await rows.locator('h3, .activity-list__description').all()) {
        expect(await content.evaluate(element => element.scrollWidth <= element.clientWidth + 1), pageName).toBe(true)
      }
    }
    expect(apiRequests).toEqual([])
  })
}

test('DPR 1.25 dan 2 mempertahankan ukuran CSS, bukan simulasi zoom browser', async ({ browser, baseURL }, testInfo) => {
  const measurements = []
  for (const deviceScaleFactor of [1, 1.25, 2]) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 720 }, deviceScaleFactor, reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      await mockReadOnlyApi(page)
      await ready(page, '/')
      await assertLayout(page, 1280, '/')
      measurements.push(await page.locator('.banner-search input').evaluate(element => ({ dpr: devicePixelRatio, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, font: getComputedStyle(element).fontSize })))
      await testInfo.attach(`dashboard-dpr-${deviceScaleFactor}.png`, { body: await page.screenshot(), contentType: 'image/png' })
    } finally {
      await context.close()
    }
  }
  for (const measurement of measurements) {
    expect(measurement.height).toBe(48)
    expect(measurement.width).toBeCloseTo(measurements[0].width, 1)
    expect(measurement.font).toBe('16px')
  }
  expect(measurements.map(measurement => measurement.dpr)).toEqual([1, 1.25, 2])
  await testInfo.attach('dpr-css-measurements.json', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' })
})
