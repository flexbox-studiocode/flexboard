// Persist cancellation for this mounted entry; blur must never restart its animation.
export default function settleMotion(event) {
  if (event.type === 'animationend' && event.target !== event.currentTarget) return
  if (event.type === 'focus' && event.target === event.currentTarget) return
  event.currentTarget.dataset.motionSettled = 'true'
}
