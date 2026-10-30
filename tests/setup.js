import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement the HTMLDialogElement modal methods. Provide inert shims so
// components using <dialog> can mount in unit tests. This mirrors the native contract
// (showModal opens, close dismisses) without requiring a real browser.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() { this.removeAttribute('open') }
  }
}

afterEach(cleanup)
