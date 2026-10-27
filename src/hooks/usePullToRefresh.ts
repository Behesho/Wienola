import { useEffect, useRef } from 'react'

const THRESHOLD = 90

/** Pulling down from the very top of the page triggers `onRefresh`. */
export function usePullToRefresh(onRefresh: () => void) {
  const handler = useRef(onRefresh)
  handler.current = onRefresh

  useEffect(() => {
    let startY: number | null = null
    let pulled = 0

    function onStart(event: TouchEvent) {
      startY = window.scrollY <= 0 ? event.touches[0].clientY : null
      pulled = 0
    }
    function onMove(event: TouchEvent) {
      if (startY === null) return
      pulled = event.touches[0].clientY - startY
    }
    function onEnd() {
      if (startY !== null && pulled > THRESHOLD && window.scrollY <= 0) handler.current()
      startY = null
      pulled = 0
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])
}
