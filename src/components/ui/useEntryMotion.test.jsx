import { useRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import useEntryMotion from './useEntryMotion.js'

function Entry({ child = false }) {
  const ref = useRef(null)
  useEntryMotion(ref)
  return <div ref={ref} data-motion-entry>{child && <span data-motion-entry />}</div>
}
afterEach(() => vi.unstubAllGlobals())

it('settles reduced entries and newly mounted children before motion is enabled', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const { container, rerender } = render(<Entry />)
  expect(container.firstChild).toHaveAttribute('data-motion-settled', 'true')
  rerender(<Entry child />)
  expect(container.querySelector('span')).toHaveAttribute('data-motion-settled', 'true')
})

it('remembers preference cancellation and cleans up listeners', () => {
  let listener
  const media = { matches: false, addEventListener: vi.fn((_, fn) => { listener = fn }), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', () => media)
  const { container, unmount } = render(<Entry child />)
  expect(container.firstChild).not.toHaveAttribute('data-motion-settled')
  media.matches = true
  listener()
  const root = container.firstChild
  expect(root).toHaveAttribute('data-motion-settled', 'true')
  media.matches = false
  listener()
  expect(root).toHaveAttribute('data-motion-settled', 'true')
  unmount()
  expect(media.removeEventListener).toHaveBeenCalledWith('change', listener)
})
