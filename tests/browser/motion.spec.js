import { expect, test } from '@playwright/test'

// Allow an isolated dev server when another workspace owns the default port.
if (process.env.MOTION_TEST_BASE_URL) test.use({ baseURL: process.env.MOTION_TEST_BASE_URL })

async function unavailableSession(page) {
  await page.route('**/api/auth/me', route => route.request().method() === 'GET' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.fallback())
}

async function finishAnimations(locator) {
  await locator.evaluate(async element => {
    const animations = element.getAnimations({ subtree: true })
    for (const animation of animations) animation.finish()
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})))
  })
}

async function animationStyle(locator, pseudo = null) {
  return locator.evaluate((element, pseudoElement) => {
    const style = getComputedStyle(element, pseudoElement)
    return { name: style.animationName, duration: style.animationDuration }
  }, pseudo)
}

async function nextPaint(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function recordReveals(page, pause = false) {
  await page.addInitScript(({ pause }) => {
    const animate = Element.prototype.animate
    window.__motionReveals = []
    Element.prototype.animate = function (...args) {
      const animation = Reflect.apply(animate, this, args)
      if (this.classList.contains('motion-reveal')) {
        window.__motionReveals.push({ node: this, keyframes: args[0], options: args[1], animation })
        if (pause) animation.pause()
      }
      return animation
    }
    const Observer = window.IntersectionObserver
    window.__motionObservers = []
    window.IntersectionObserver = class extends Observer {
      constructor(callback, options) {
        super(callback, options)
        window.__motionObservers.push(options)
      }
    }
  }, { pause })
}

async function revealCount(page) {
  return page.evaluate(() => window.__motionReveals.length)
}

const writes = new WeakMap()
test.afterEach(async ({ page }) => {
  expect(writes.get(page), 'motion interactions do not send API mutations').toEqual([])
})
test.beforeEach(async ({ page }) => {
  const requests = []
  writes.set(page, requests)
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/') && request.method() !== 'GET') requests.push(`${request.method()} ${request.url()}`)
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/api/tasks', route => route.request().method() === 'GET' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.fallback())
  // Hold entry effects at a visible frame so assertions never race a 220ms effect.
  await page.addInitScript(() => {
    document.addEventListener('animationstart', event => {
      if (!event.target.matches('.motion-route, .auth-main')) return
      for (const animation of event.target.getAnimations()) {
        animation.pause()
        animation.currentTime = 100
      }
    }, true)
  })
})

test('route entry preserves shell and query/auth rerenders without repeating session checks', async ({ page }) => {
  let releaseSession
  let requests = 0
  const responseReady = new Promise(resolve => { releaseSession = resolve })
  await page.route('**/api/auth/me', async route => {
    requests++
    await responseReady
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })
  await page.goto('/tasks')
  const route = page.locator('.motion-route')
  await expect(route).toBeVisible()
  expect(await animationStyle(route)).toEqual({ name: 'motion-fade-in', duration: '0.22s' })
  await route.evaluate(element => {
    window.__motionRoute = element
    window.__motionHeader = document.querySelector('.site-header')
    window.__motionBanner = document.querySelector('.welcome-banner')
  })
  await finishAnimations(route)
  releaseSession()
  await expect(page.locator('.header-account')).toContainText('Layanan tidak tersedia')
  expect(await route.evaluate(element => element === window.__motionRoute)).toBe(true)
  expect(await route.evaluate(element => element.getAnimations().length)).toBe(0)

  const search = page.getByLabel('Cari tugas berdasarkan judul atau deskripsi')
  await search.fill('motion query')
  await search.press('Enter')
  await expect(page).toHaveURL(/\/tasks\?q=motion%20query$/)
  expect(await route.evaluate(element => element === window.__motionRoute)).toBe(true)
  expect(await route.evaluate(element => element.getAnimations().length)).toBe(0)
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Progres Tim', exact: true }).click()
  await expect(page).toHaveURL(/\/team-progress$/)
  expect(await route.evaluate(element => element === window.__motionRoute)).toBe(false)
  expect(await page.evaluate(() => document.querySelector('.site-header') === window.__motionHeader && document.querySelector('.welcome-banner') === window.__motionBanner)).toBe(true)
  expect(await animationStyle(route)).toEqual({ name: 'motion-fade-in', duration: '0.22s' })
  await expect(page.locator('main')).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(requests).toBe(1)
  await finishAnimations(route)
  await expect(route).toHaveCSS('opacity', '1')
})

test('auth entry and control feedback use short effects without moving disabled controls or hiding focus', async ({ page }) => {
  await unavailableSession(page)
  await page.goto('/login')
  expect(await animationStyle(page.locator('.auth-main'))).toEqual({ name: 'motion-fade-in', duration: '0.22s' })
  await page.getByLabel('Email', { exact: true }).focus()
  await expect(page.locator('.auth-main')).toHaveAttribute('data-motion-settled', 'true')
  await page.locator('.auth-main').focus()
  expect(await animationStyle(page.locator('.auth-main'))).toEqual({ name: 'none', duration: '0s' })
  await expect(page.locator('.auth-main')).toHaveCSS('opacity', '1')
  await page.goto('/tasks/new')
  const add = page.getByRole('button', { name: 'Tambah item checklist' })
  const feedback = await add.evaluate(element => {
    const style = getComputedStyle(element)
    return Object.fromEntries(style.transitionProperty.split(', ').map((property, index) => [property, style.transitionDuration.split(', ')[index]]))
  })
  expect(feedback).toMatchObject({ 'background-color': '0.12s', 'border-color': '0.12s', color: '0.12s', transform: '0.08s' })
  await add.focus()
  await expect(add).toBeFocused()
  expect(await add.evaluate(element => {
    const style = getComputedStyle(element)
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
  })).toBe(true)
  await add.scrollIntoViewIfNeeded()
  const bounds = await add.boundingBox()
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await finishAnimations(add)
  expect(await add.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(1)
  await page.mouse.up()
  const disabled = page.getByRole('button', { name: 'Simpan tugas' })
  await expect(disabled).toBeDisabled()
  await disabled.scrollIntoViewIfNeeded()
  const disabledBounds = await disabled.boundingBox()
  await page.mouse.move(disabledBounds.x + disabledBounds.width / 2, disabledBounds.y + disabledBounds.height / 2)
  await page.mouse.down()
  await finishAnimations(disabled)
  await expect(disabled).toHaveCSS('transform', 'none')
  await page.mouse.up()
})

test('mobile dialog entry and backdrop never delay rapid close, Escape, or restored focus', async ({ page }) => {
  await unavailableSession(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/tasks')
  const trigger = page.getByRole('button', { name: 'Buka menu navigasi' })
  const dialog = page.getByRole('dialog', { name: 'Navigasi workspace' })
  await trigger.click()
  await expect(dialog).toBeVisible()
  expect(await animationStyle(dialog)).toEqual({ name: 'motion-dialog-in', duration: '0.18s' })
  expect(await animationStyle(dialog, '::backdrop')).toEqual({ name: 'motion-fade-in', duration: '0.18s' })
  const entry = await dialog.evaluate(element => element.getAnimations().map(animation => ({ name: animation.animationName, duration: animation.effect.getTiming().duration, frames: animation.effect.getKeyframes() })))
  for (const animation of entry.filter(animation => animation.name === 'motion-dialog-in')) {
    expect(animation.duration).toBe(180)
    expect(animation.frames[0].transform).toMatch(/(?:8px|matrix\(1, 0, 0, 1, 0, 8\))/)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Tutup dialog', exact: true }).click()
  expect(await page.locator('.mobile-navigation').evaluate(element => element.open)).toBe(false)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('checklist insertion yields immediately to focus and deletion never waits for animation', async ({ page }) => {
  await unavailableSession(page)
  await page.goto('/tasks/new')
  const add = page.getByRole('button', { name: 'Tambah item checklist' })
  await add.click()
  const first = page.getByLabel('Item checklist 1', { exact: true })
  await expect(first).toBeFocused()
  const row = page.locator('.checklist-draft__row').first()
  expect(await animationStyle(row)).toEqual({ name: 'none', duration: '0s' })
  await first.fill('First local item')
  await expect(row).toHaveAttribute('data-motion-settled', 'true')
  await add.focus()
  expect(await animationStyle(row)).toEqual({ name: 'none', duration: '0s' })
  expect(await row.evaluate(element => element.getAnimations().length)).toBe(0)
  await expect(row).toHaveCSS('opacity', '1')
  await add.click()
  await expect(page.getByLabel('Item checklist 2', { exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Hapus item checklist 2', exact: true }).click()
  await expect(page.locator('.checklist-draft__row')).toHaveCount(1)
  await expect(first).toBeFocused()
  await expect(first).toHaveValue('First local item')
  await page.getByRole('button', { name: 'Hapus item checklist 1', exact: true }).click()
  await expect(page.locator('.checklist-draft__row')).toHaveCount(0)
  await expect(add).toBeFocused()
})

test('secondary reveal stays visible while pending, runs once, and skips initially visible content', async ({ page }) => {
  await unavailableSession(page)
  await recordReveals(page)
  await page.setViewportSize({ width: 390, height: 640 })
  await page.goto('/tasks/new')
  const reveal = page.locator('.motion-reveal')
  await expect(reveal).toHaveCount(1)
  expect(await reveal.evaluate(element => element.getBoundingClientRect().top >= innerHeight)).toBe(true)
  await expect(reveal).toHaveCSS('opacity', '1')
  await expect(reveal).toHaveCSS('visibility', 'visible')
  expect(await revealCount(page)).toBe(0)
  expect(await page.evaluate(() => window.__motionObservers.some(options => options?.rootMargin === '0px 0px 48px 0px'))).toBe(true)
  await reveal.scrollIntoViewIfNeeded()
  await expect.poll(() => revealCount(page)).toBe(1)
  const recorded = await page.evaluate(() => {
    const { keyframes, options } = window.__motionReveals[0]
    return { keyframes, options }
  })
  expect(recorded.keyframes).toEqual([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }])
  expect(recorded.options.duration).toBe(220)
  await finishAnimations(reveal)
  await expect(reveal).toHaveCSS('opacity', '1')
  await page.evaluate(() => scrollTo(0, 0))
  await nextPaint(page)
  await reveal.scrollIntoViewIfNeeded()
  await nextPaint(page)
  expect(await revealCount(page)).toBe(1)

  await page.setViewportSize({ width: 1440, height: 4000 })
  await page.goto('/tasks/new')
  await expect(reveal).toBeInViewport()
  await nextPaint(page)
  expect(await revealCount(page)).toBe(0)
  expect(await page.evaluate(() => window.__motionObservers.length)).toBe(0)
})

test('focus cancels pending and running reveals without concealing help or moving focus', async ({ page }) => {
  await unavailableSession(page)
  await recordReveals(page, true)
  await page.setViewportSize({ width: 390, height: 640 })
  await page.goto('/tasks/new')
  const reveal = page.locator('.motion-reveal')
  const summary = reveal.locator('summary')
  await summary.evaluate(element => element.focus({ preventScroll: true }))
  await expect(summary).toBeFocused()
  await reveal.scrollIntoViewIfNeeded()
  await nextPaint(page)
  expect(await revealCount(page)).toBe(0)
  await expect(reveal).toHaveCSS('opacity', '1')

  await page.reload()
  await reveal.scrollIntoViewIfNeeded()
  await expect.poll(() => revealCount(page)).toBe(1)
  await expect.poll(() => reveal.evaluate(element => element.getAnimations().length)).toBe(1)
  await summary.focus()
  await expect(summary).toBeFocused()
  await expect.poll(() => reveal.evaluate(element => element.getAnimations().length)).toBe(0)
  expect(await page.evaluate(() => window.__motionReveals[0].animation.playState)).toBe('idle')
  await expect(reveal).toHaveCSS('opacity', '1')
  await expect(reveal).toHaveCSS('transform', 'none')
})

test('changing reduced motion cancels active CSS and WAAPI effects and does not replay reveals', async ({ page }) => {
  await unavailableSession(page)
  await recordReveals(page, true)
  await page.setViewportSize({ width: 390, height: 640 })
  await page.goto('/tasks/new')
  const reveal = page.locator('.motion-reveal')
  await reveal.scrollIntoViewIfNeeded()
  await expect.poll(() => revealCount(page)).toBe(1)
  const trigger = page.getByRole('button', { name: 'Buka menu navigasi' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Navigasi workspace' })
  await expect(dialog).toBeVisible()
  await dialog.evaluate(element => element.getAnimations().forEach(animation => animation.pause()))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => reveal.evaluate(element => element.getAnimations().length)).toBe(0)
  await expect.poll(() => dialog.evaluate(element => element.getAnimations().length)).toBe(0)
  expect(await animationStyle(dialog)).toEqual({ name: 'none', duration: '0s' })
  expect(await animationStyle(dialog, '::backdrop')).toEqual({ name: 'none', duration: '0s' })
  expect(await animationStyle(page.locator('.motion-route'))).toEqual({ name: 'none', duration: '0s' })
  await expect(trigger).toHaveCSS('transition-property', 'none')
  await expect(page.getByLabel('Judul tugas', { exact: true })).toHaveCSS('transition-property', 'none')
  await expect(reveal).toHaveCSS('opacity', '1')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await animationStyle(page.locator('.motion-route'))).toEqual({ name: 'none', duration: '0s' })
  await reveal.scrollIntoViewIfNeeded()
  await nextPaint(page)
  expect(await revealCount(page)).toBe(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  expect(await animationStyle(page.locator('.auth-main'))).toEqual({ name: 'none', duration: '0s' })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await animationStyle(page.locator('.auth-main'))).toEqual({ name: 'none', duration: '0s' })
})

test('motion and reduced-motion layouts stay within 320, 390, 768 and 1440px', async ({ page }) => {
  await unavailableSession(page)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const reducedMotion of ['no-preference', 'reduce']) {
      await page.emulateMedia({ reducedMotion })
      await page.goto('/tasks/new')
      await page.getByRole('button', { name: 'Tambah item checklist' }).click()
      await expect(page.getByLabel('Item checklist 1', { exact: true })).toBeFocused()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px, ${reducedMotion}`).toBe(true)
      await page.locator('.motion-reveal').scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `reveal: ${width}px, ${reducedMotion}`).toBe(true)
    }
  }
})
