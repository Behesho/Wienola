/**
 * Shrinks and fades `element` along an arc into `target` (e.g. a bottom-nav
 * item), then gives the target a small "received" bounce. Resolves when the
 * flight is over; resolves immediately when motion is reduced or the Web
 * Animations API is unavailable.
 */
export function flyTo(
  element: HTMLElement | null,
  target: Element | null,
): Promise<void> {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!element || !target || reduceMotion || typeof element.animate !== 'function') {
    return Promise.resolve()
  }

  const from = element.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)

  element.style.position = 'relative'
  element.style.zIndex = '100'
  element.style.pointerEvents = 'none'

  const flight = element.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.2}px, ${dy * 0.2 - 40}px) scale(0.75)`,
        opacity: 0.95,
        offset: 0.35,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.06)`, opacity: 0 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.55, 0, 0.7, 0.2)', fill: 'forwards' },
  )

  return flight.finished.then(
    () => {
      if (typeof target.animate === 'function') {
        target.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.25)' },
            { transform: 'scale(1)' },
          ],
          { duration: 380, easing: 'ease-out' },
        )
      }
    },
    () => undefined,
  )
}
