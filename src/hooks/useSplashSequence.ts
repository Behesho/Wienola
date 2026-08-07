import { useEffect, useState } from 'react'

/** Total time the completed splash is held on screen before the exit transition starts. */
const HOLD_MS = 2000
/** Fade-out duration of the exit transition (see .splash--exiting in SplashScreen.css). */
const EXIT_MS = 350

/**
 * Drives the splash screen lifecycle: holds the finished splash for HOLD_MS,
 * then flips `exiting` (triggering the CSS fade-out) and calls onComplete
 * once that transition has finished.
 */
export function useSplashSequence(onComplete: () => void) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const holdTimer = window.setTimeout(() => setExiting(true), HOLD_MS)
    return () => window.clearTimeout(holdTimer)
  }, [])

  useEffect(() => {
    if (!exiting) return
    const exitTimer = window.setTimeout(onComplete, EXIT_MS)
    return () => window.clearTimeout(exitTimer)
  }, [exiting, onComplete])

  return { exiting }
}
