/**
 * A short, soft two-tone chime synthesized with the Web Audio API — no
 * audio asset file needed. `startRepeating` loops it every few seconds
 * until `stop()` is called, and guarantees only one loop/one tone plays
 * at a time (repeated `startRepeating` calls are no-ops while running).
 */

let audioContext: AudioContext | null = null
let repeatTimer: ReturnType<typeof setInterval> | null = null

type AudioContextCtor = typeof AudioContext

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) {
    audioContext = new Ctor()
  }
  return audioContext
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startTime)

  // Punchier attack/decay than a soft UI blip — this has to cut through a
  // driver's pocket or car noise, not just sound nice at a desk.
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

/** Buzzes the phone, where supported — works even if the ringer is muted. */
function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration API unavailable — ignore.
  }
}

/** Plays one chime immediately. Returns false if audio couldn't play (e.g. autoplay-blocked). */
export function playChimeOnce(): boolean {
  const ctx = getContext()
  vibrate([180, 90, 180])
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      // Resuming is async; schedule the tones once it actually resumes so a
      // context that's still waking up doesn't silently drop the sound.
      void ctx.resume().then(() => {
        const now = ctx.currentTime
        playTone(ctx, 880, now, 0.18)
        playTone(ctx, 1175, now + 0.16, 0.22)
      })
      return true
    }
    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.18)
    playTone(ctx, 1175, now + 0.16, 0.22)
    return true
  } catch {
    return false
  }
}

/** Starts repeating the chime every `intervalMs` until `stopRepeating()` is called. */
export function startRepeating(intervalMs = 4000) {
  if (repeatTimer) return // already running — never overlap
  playChimeOnce()
  repeatTimer = setInterval(playChimeOnce, intervalMs)
}

export function stopRepeating() {
  if (repeatTimer) {
    clearInterval(repeatTimer)
    repeatTimer = null
  }
}

/**
 * Browsers keep audio muted until the user has interacted with the page, so a
 * chime triggered by a realtime event would stay silent. This makes the very
 * first tap/click/key press wake the audio context up.
 */
export function unlockAudio() {
  const ctx = getContext()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') void ctx.resume()
    // A one-sample silent buffer fully unlocks playback on iOS Safari.
    const source = ctx.createBufferSource()
    source.buffer = ctx.createBuffer(1, 1, 22050)
    source.connect(ctx.destination)
    source.start(0)
  } catch {
    // Nothing to do — audio just stays locked until the next interaction.
  }
}

/** Unlocks audio on the first user interaction; returns a cleanup function. */
export function installAudioUnlock(): () => void {
  const events = ['pointerdown', 'touchend', 'click', 'keydown'] as const
  function handler() {
    unlockAudio()
    remove()
  }
  function remove() {
    events.forEach((name) => window.removeEventListener(name, handler))
  }
  events.forEach((name) => window.addEventListener(name, handler, { passive: true }))
  // Also try right away: works when the page was already interacted with.
  unlockAudio()

  // Mobile browsers suspend the AudioContext whenever the tab/app is
  // backgrounded (screen locked, app switched away) — re-resume it every
  // time the driver comes back, so a chime a minute later isn't silent.
  function handleVisibility() {
    if (document.visibilityState === 'visible') unlockAudio()
  }
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    remove()
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}
