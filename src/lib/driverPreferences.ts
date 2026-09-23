const NOTIFICATIONS_KEY = 'lasten-wien-driver-notifications'
const SOUND_KEY = 'lasten-wien-driver-sound'

function getFlag(key: string, defaultValue: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null) return defaultValue
    return stored === 'true'
  } catch {
    return defaultValue
  }
}

function setFlag(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // localStorage unavailable — preference just won't persist this session.
  }
}

export function getNotificationsEnabled(): boolean {
  return getFlag(NOTIFICATIONS_KEY, true)
}

export function setNotificationsEnabled(value: boolean) {
  setFlag(NOTIFICATIONS_KEY, value)
}

export function getSoundEnabled(): boolean {
  return getFlag(SOUND_KEY, true)
}

export function setSoundEnabled(value: boolean) {
  setFlag(SOUND_KEY, value)
}
