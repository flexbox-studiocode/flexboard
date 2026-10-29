import { expect, it } from 'vitest'
import settleMotion from './settleMotion.js'

it('mengabaikan animasi turunan tetapi menyelesaikan entry sendiri', () => {
  const root = document.createElement('div')
  const child = document.createElement('input')
  root.append(child)
  settleMotion({ type: 'animationend', currentTarget: root, target: child })
  expect(root.dataset.motionSettled).toBeUndefined()
  settleMotion({ type: 'animationend', currentTarget: root, target: root })
  expect(root.dataset.motionSettled).toBe('true')
})

it('fokus landmark tidak menghentikan entry; fokus kontrol membatalkan permanen', () => {
  const root = document.createElement('div')
  const child = document.createElement('input')
  settleMotion({ type: 'focus', currentTarget: root, target: root })
  expect(root.dataset.motionSettled).toBeUndefined()
  settleMotion({ type: 'focus', currentTarget: root, target: child })
  expect(root.dataset.motionSettled).toBe('true')
})
