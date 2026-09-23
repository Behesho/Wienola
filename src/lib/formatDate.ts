export function formatOrderDateLabel(
  dateStr: string | null,
  express: boolean,
): string {
  if (express) return 'So schnell wie möglich'
  if (!dateStr) return '–'

  const date = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) return 'Heute'
  if (date.getTime() === tomorrow.getTime()) return 'Morgen'

  return date.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export function formatDateTime(
  dateStr: string | null,
  timeStr: string | null,
  express: boolean,
): string {
  const dateLabel = formatOrderDateLabel(dateStr, express)
  const time = formatTime(timeStr)
  if (express) return dateLabel
  return time ? `${dateLabel} · ${time}` : dateLabel
}
