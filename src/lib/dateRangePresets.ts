import type { DateRange } from './orders'

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Heute',
  yesterday: 'Gestern',
  week: 'Diese Woche',
  month: 'Dieser Monat',
  custom: 'Benutzerdefiniert',
}

// Local calendar-date components, not toISOString() — that converts to UTC
// first, which silently shifts "today" to the wrong day whenever the
// browser's timezone isn't UTC.
function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPresetRange(
  preset: DatePreset,
  customFrom: string,
  customTo: string,
): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const iso = toIsoDate(yesterday)
    return { from: iso, to: iso }
  }

  if (preset === 'week') {
    const day = today.getDay() === 0 ? 7 : today.getDay() // Monday-first week
    const monday = new Date(today)
    monday.setDate(monday.getDate() - (day - 1))
    return { from: toIsoDate(monday), to: toIsoDate(today) }
  }

  if (preset === 'month') {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toIsoDate(firstOfMonth), to: toIsoDate(today) }
  }

  if (preset === 'custom') {
    return { from: customFrom || toIsoDate(today), to: customTo || toIsoDate(today) }
  }

  const iso = toIsoDate(today)
  return { from: iso, to: iso }
}
