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

  // Soft attack/decay envelope so it's noticeable but not harsh.
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.16, startTime + 0.03)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

/** Plays one chime immediately. Returns false if audio couldn't play (e.g. autoplay-blocked). */
export function playChimeOnce(): boolean {
  const ctx = getContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.16)
    playTone(ctx, 1175, now + 0.14, 0.2)
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
