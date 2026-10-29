import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ScrollReveal } from './ScrollReveal.jsx'

let observers
let media
let mediaListeners
let animate
let animations

function enter(observer = observers.at(-1)) {
  observer.callback([{ target: screen.getByTestId('reveal'), isIntersecting: true }])
}

function setMotion(matches) {
  media.matches = matches
  mediaListeners.forEach(listener => listener({ matches }))
}

function example(children = <button>Help</button>) {
  return <ScrollReveal data-testid="reveal" className="help">{children}</ScrollReveal>
}

beforeEach(() => {
  observers = []
  animations = []
  mediaListeners = new Set()
  media = {
    matches: true,
    addEventListener: vi.fn((_, listener) => mediaListeners.add(listener)),
    removeEventListener: vi.fn((_, listener) => mediaListeners.delete(listener)),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      observers.push(this)
    }
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: window.innerHeight + 100 })
  animate = vi.fn(() => {
    const animation = { cancel: vi.fn(), onfinish: null }
    animations.push(animation)
    return animation
  })
  vi.stubGlobal('Animation', undefined)
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, writable: true, value: animate })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete HTMLElement.prototype.animate
})

describe('ScrollReveal', () => {
  it('renders visible content and custom classes without hiding pending content', () => {
    render(example())
    const node = screen.getByTestId('reveal')
    expect(node.tagName).toBe('DIV')
    expect(node).toHaveClass('motion-reveal', 'help')
    expect(screen.getByRole('button', { name: 'Help' })).toBeVisible()
    expect(node).not.toHaveAttribute('style')
    expect(node).not.toHaveAttribute('hidden')
    expect(animate).not.toHaveBeenCalled()
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: no-preference)')
    expect(observers[0].options).toEqual({ rootMargin: '0px 0px 48px 0px' })
    expect(observers[0].observe).toHaveBeenCalledWith(node)
  })

  it('animates once on entry with the required keyframes and timing', () => {
    render(example())
    observers[0].callback([{ target: screen.getByTestId('reveal'), isIntersecting: false }])
    expect(animate).not.toHaveBeenCalled()
    enter()
    enter()
    expect(animate).toHaveBeenCalledExactlyOnceWith([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('uses computed motion tokens when available', () => {
    render(<ScrollReveal data-testid="reveal" style={{ '--motion-enter': '0.3s', '--motion-distance': '6px', '--motion-ease': 'ease-out' }}>Help</ScrollReveal>)
    enter()
    expect(animate).toHaveBeenCalledWith([
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 300, easing: 'ease-out' })
  })

  it.each([0, 100, -100])('skips content already in or above the viewport at top %s', top => {
    HTMLElement.prototype.getBoundingClientRect.mockReturnValue({ top })
    render(example())
    expect(observers).toHaveLength(0)
    expect(animate).not.toHaveBeenCalled()
  })

  it('skips content containing focus at mount', () => {
    render(example(<button autoFocus>Help</button>))
    expect(screen.getByRole('button')).toHaveFocus()
    expect(observers).toHaveLength(0)
  })

  it('disconnects pending content when focus enters and never replays it', () => {
    render(example())
    screen.getByRole('button').focus()
    expect(observers[0].disconnect).toHaveBeenCalled()
    enter()
    expect(animate).not.toHaveBeenCalled()
  })

  it('checks activeElement at entry even without a focusin event', () => {
    render(example())
    const node = screen.getByTestId('reveal')
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(node)
    enter()
    expect(animate).not.toHaveBeenCalled()
  })

  it('cancels active animation immediately on focusin', () => {
    render(example())
    enter()
    fireEvent.focusIn(screen.getByRole('button'))
    expect(animations[0].cancel).toHaveBeenCalledOnce()
    expect(screen.getByRole('button')).toBeVisible()
    enter()
    expect(animate).toHaveBeenCalledOnce()
  })

  it('does not animate with reduced motion and never starts after toggling back', () => {
    media.matches = false
    render(example())
    setMotion(true)
    expect(observers).toHaveLength(0)
    expect(animate).not.toHaveBeenCalled()
  })

  it('disconnects pending reveals when reduced motion changes and never restarts', () => {
    render(example())
    setMotion(false)
    expect(observers[0].disconnect).toHaveBeenCalled()
    setMotion(true)
    enter()
    expect(animate).not.toHaveBeenCalled()
    expect(observers).toHaveLength(1)
  })

  it('cancels active animation on a reduced-motion change', () => {
    render(example())
    enter()
    setMotion(false)
    expect(animations[0].cancel).toHaveBeenCalledOnce()
    setMotion(true)
    enter()
    expect(animate).toHaveBeenCalledOnce()
  })

  it.each(['IntersectionObserver', 'animate', 'matchMedia'])('stays visible without %s support', feature => {
    if (feature === 'animate') delete HTMLElement.prototype.animate
    else vi.stubGlobal(feature, undefined)
    render(example())
    expect(screen.getByRole('button')).toBeVisible()
    expect(observers).toHaveLength(0)
  })

  it('stays visible when observer construction fails', () => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor() { throw new Error('Unsupported observer') }
    })
    render(example())
    expect(screen.getByRole('button')).toBeVisible()
    expect(mediaListeners.size).toBe(0)
  })

  it('stays visible when animation fails', () => {
    animate.mockImplementation(() => { throw new Error('Unsupported animation') })
    render(example())
    expect(() => enter()).not.toThrow()
    expect(screen.getByRole('button')).toBeVisible()
    enter()
    expect(animate).toHaveBeenCalledOnce()
  })

  it('supports legacy media query listeners and removes them on cleanup', () => {
    media.addListener = vi.fn(listener => mediaListeners.add(listener))
    media.removeListener = vi.fn(listener => mediaListeners.delete(listener))
    delete media.addEventListener
    delete media.removeEventListener
    const { unmount } = render(example())
    expect(media.addListener).toHaveBeenCalledOnce()
    unmount()
    expect(media.removeListener).toHaveBeenCalledOnce()
    expect(mediaListeners.size).toBe(0)
  })

  it('disconnects pending observers, removes listeners and ignores stale entries on cleanup', () => {
    const { unmount } = render(example())
    const observer = observers[0]
    const node = screen.getByTestId('reveal')
    unmount()
    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mediaListeners.size).toBe(0)
    observer.callback([{ target: node, isIntersecting: true }])
    fireEvent.focusIn(node)
    expect(animate).not.toHaveBeenCalled()
  })

  it('cancels active animation on unmount but does not cancel a finished animation', () => {
    const first = render(example())
    enter()
    first.unmount()
    expect(animations[0].cancel).toHaveBeenCalledOnce()
    expect(animations[0].onfinish).toBeNull()
    const second = render(example())
    enter()
    animations[1].onfinish()
    second.unmount()
    expect(animations[1].cancel).not.toHaveBeenCalled()
  })

  it('reconnects pending observers safely under StrictMode and still animates once', () => {
    const { unmount } = render(<StrictMode>{example()}</StrictMode>)
    expect(observers).toHaveLength(2)
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
    enter(observers[0])
    expect(animate).not.toHaveBeenCalled()
    enter(observers[1])
    enter(observers[1])
    expect(animate).toHaveBeenCalledOnce()
    expect(mediaListeners.size).toBe(1)
    unmount()
    expect(mediaListeners.size).toBe(0)
    expect(animations[0].cancel).toHaveBeenCalledOnce()
  })
})
