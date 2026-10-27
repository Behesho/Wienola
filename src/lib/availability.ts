/** One availability entry of a driver for one calendar day. */
export interface AvailabilityRow {
  id: string
  driver_id: string
  /** yyyy-mm-dd */
  day: string
  available: boolean
  /** null = the whole day */
  start_hour: number | null
  end_hour: number | null
}

export type DayState = 'yes' | 'no' | 'partial' | 'none'

export const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** yyyy-mm-dd of a local date. */
export function isoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Local midnight of a yyyy-mm-dd string. */
export function parseIsoDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** Rows of one driver on one day → green / red / orange / grey. */
export function dayState(rows: AvailabilityRow[]): DayState {
  if (rows.length === 0) return 'none'
  if (rows.some((row) => row.start_hour !== null)) return 'partial'
  return rows.some((row) => row.available) ? 'yes' : 'no'
}

/** "Verfügbar ab 17:00 Uhr", "Nicht verfügbar 14:00–16:00 Uhr", … */
export function describeDay(rows: AvailabilityRow[]): string {
  if (rows.length === 0) return 'Keine Angabe'
  return rows
    .map((row) => {
      if (row.start_hour === null || row.end_hour === null) {
        return row.available ? 'Ganztägig verfügbar' : 'Nicht verfügbar'
      }
      if (row.available && row.end_hour === 24) {
        return `Verfügbar ab ${hourLabel(row.start_hour)} Uhr`
      }
      const range = `${hourLabel(row.start_hour)}–${hourLabel(row.end_hour)} Uhr`
      return `${row.available ? 'Verfügbar' : 'Nicht verfügbar'} ${range}`
    })
    .join(' · ')
}

/** One short line for "today" on a driver card. */
export function todayLine(rows: AvailabilityRow[]): string {
  const state = dayState(rows)
  if (state === 'none') return 'Heute keine Angabe'
  if (state === 'yes') return '✓ Heute verfügbar'
  if (state === 'no') return '✕ Heute nicht verfügbar'
  const parts = rows
    .filter((row) => row.start_hour !== null && row.end_hour !== null)
    .map(
      (row) =>
        `${hourLabel(row.start_hour!)}–${hourLabel(row.end_hour!)} ${row.available ? '✓' : '✕'}`,
    )
  return `Heute: ${parts.join(' · ')}`
}

/** Index rows by "driverId|day". */
export function indexAvailability(rows: AvailabilityRow[]): Map<string, AvailabilityRow[]> {
  const map = new Map<string, AvailabilityRow[]>()
  for (const row of rows) {
    const key = `${row.driver_id}|${row.day}`
    const list = map.get(key)
    if (list) list.push(row)
    else map.set(key, [row])
  }
  return map
}

/** A driver counts as available on a day unless he marked the whole day off. */
export function countsAsAvailable(state: DayState): boolean {
  return state === 'yes' || state === 'partial'
}
