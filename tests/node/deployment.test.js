import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'))
const [, apiFallback, spaFallback] = config.routes
const healthSource = await readFile(new URL('../../api/health.js', import.meta.url), 'utf8')

test('Vercel memprioritaskan file dan serverless function sebelum fallback', () => {
  assert.deepEqual(config.routes[0], { handle: 'filesystem' })
  // Existing /api/health is resolved by filesystem, not rewritten as HTML.
  assert.ok(healthSource.includes('export default'))
})


test('API yang tidak tersedia tidak dikembalikan sebagai halaman frontend', () => {
  assert.equal(apiFallback.status, 404)
  assert.equal(apiFallback.dest, undefined)
  for (const path of ['/api', '/api/', '/api/unavailable']) assert.match(path, new RegExp(`^${apiFallback.src}$`))
  assert.doesNotMatch('/apiary', new RegExp(`^${apiFallback.src}$`))
})

test('deep link frontend mencapai index.html setelah pemeriksaan filesystem dan API', () => {
  assert.equal(spaFallback.dest, '/index.html')
  for (const path of ['/login', '/tasks/new', '/tasks/unavailable/edit', '/team-progress', '/members', '/activity']) {
    assert.doesNotMatch(path, new RegExp(`^${apiFallback.src}$`))
    assert.match(path, new RegExp(`^${spaFallback.src}$`))
  }
})
