import { useEffect, useRef, useSyncExternalStore } from 'react'

export const PULL_THRESHOLD = 80
const MAX_PULL = 120

interface Entry {
  handler: { current: () => void }
  priority: number
}

// Several components may ask for pull-to-refresh at once (the app shell
// reloads the page, an admin page only reloads its data). Only the entry with
// the highest priority — the most recently mounted one on a tie — reacts.
const entries: Entry[] = []
let distance = 0
const subscribers = new Set<() => void>()

function setDistance(next: number) {
  if (next === distance) return
  distance = next
  subscribers.forEach((notify) => notify())
}

function activeEntry(): Entry | undefined {
  let best: Entry | undefined
  for (const entry of entries) {
    if (!best || entry.priority >= best.priority) best = entry
  }
  return best
}

let startX = 0
let startY: number | null = null
let pulled = 0

function onStart(event: TouchEvent) {
  const target = event.target as Element | null
  const blocked = target?.closest?.('input, textarea, select, [role="dialog"], [role="alertdialog"]')
  if (blocked || window.scrollY > 0 || event.touches.length !== 1) {
    startY = null
    return
  }
  startX = event.touches[0].clientX
  startY = event.touches[0].clientY
  pulled = 0
}

function onMove(event: TouchEvent) {
  if (startY === null) return
  const dy = event.touches[0].clientY - startY
  const dx = event.touches[0].clientX - startX
  if (Math.abs(dx) > Math.abs(dy) || dy <= 0 || window.scrollY > 0) {
    pulled = 0
    setDistance(0)
    return
  }
  pulled = dy
  setDistance(Math.min(dy / 1.6, MAX_PULL))
}

function onEnd() {
  const fire = startY !== null && pulled / 1.6 >= PULL_THRESHOLD * 0.75 && window.scrollY <= 0
  startY = null
  pulled = 0
  setDistance(0)
  if (fire) activeEntry()?.handler.current()
}

function install() {
  window.addEventListener('touchstart', onStart, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: true })
  window.addEventListener('touchend', onEnd)
  window.addEventListener('touchcancel', onEnd)
}

function uninstall() {
  window.removeEventListener('touchstart', onStart)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
  window.removeEventListener('touchcancel', onEnd)
}

/** Pulling down from the very top of the page triggers `onRefresh`. */
export function usePullToRefresh(onRefresh: () => void, priority = 0) {
  const handler = useRef(onRefresh)
  handler.current = onRefresh

  useEffect(() => {
    const entry: Entry = { handler, priority }
    if (entries.length === 0) install()
    entries.push(entry)
    return () => {
      entries.splice(entries.indexOf(entry), 1)
      if (entries.length === 0) uninstall()
    }
  }, [priority])
}

/** How far the user has pulled right now (0 when idle) — drives the indicator. */
export function usePullDistance(): number {
  return useSyncExternalStore(
    (notify) => {
      subscribers.add(notify)
      return () => subscribers.delete(notify)
    },
    () => distance,
  )
}
