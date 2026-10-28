import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = (name) => readFile(new URL(`../../${name}`, import.meta.url), 'utf8').then(JSON.parse)
const config = await readJson('vercel.json')
const devConfig = await readJson('vercel.dev.json')
const healthSource = await readFile(new URL('../../api/health.js', import.meta.url), 'utf8')
const authSource = await readFile(new URL('../../api/auth/[...all].js', import.meta.url), 'utf8')
const frontendRewrite = config.rewrites?.find(({ source }) => source.includes('api'))

 test('production config uses one SPA rewrite and preserves API handlers', () => {
  assert.ok(frontendRewrite)
  assert.equal(config.routes, undefined)
  assert.equal(frontendRewrite.destination, '/index.html')
  assert.ok(healthSource.includes('export default'))
  assert.ok(authSource.includes('betterAuthHandler'))
})

test('production SPA rewrite excludes API paths', () => {
  for (const path of ['/api', '/api/health', '/api/auth/me', '/api/auth/sign-in/email']) {
    assert.doesNotMatch(path, new RegExp(frontendRewrite.source))
  }
})

test('development config delegates to Vite without SPA catch-all routing', () => {
  assert.equal(devConfig.devCommand, 'vite --port $PORT')
  assert.equal(devConfig.routes, undefined)
  assert.equal(devConfig.rewrites, undefined)
  for (const path of ['/src/main.jsx', '/@vite/client', '/@id/react', '/@fs/project/file.js']) {
    assert.equal(path.includes('index.html'), false)
  }
})

test('frontend deep links use production HTML fallback', () => {
  for (const path of ['/', '/login', '/tasks', '/team-progress', '/unknown']) {
    assert.match(path, new RegExp(frontendRewrite.source))
  }
})
