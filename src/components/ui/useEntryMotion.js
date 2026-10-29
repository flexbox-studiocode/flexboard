import { useLayoutEffect } from 'react'

// Remember skipped/canceled entrances. Changing OS preferences must not replay old content.
export default function useEntryMotion(ref) {
  useLayoutEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const settle = () => {
      if (!media.matches || !ref.current) return
      if (ref.current.matches('[data-motion-entry]')) ref.current.dataset.motionSettled = 'true'
      ref.current.querySelectorAll('[data-motion-entry]').forEach(node => { node.dataset.motionSettled = 'true' })
    }
    settle()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', settle)
      return () => media.removeEventListener('change', settle)
    }
    media.addListener?.(settle)
    return () => media.removeListener?.(settle)
  })
}
