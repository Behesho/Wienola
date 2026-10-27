import { getOrderPrice } from './pricing'
import { paymentMethodOf, type Order } from '../types/order'

const round2 = (value: number) => Math.round(value * 100) / 100

/** Prices are gross incl. 20 % VAT; the driver gets 60 % of the net amount. */
export function driverShare(gross: number): number {
  return round2((gross / 1.2) * 0.6)
}

/** Orders that count as delivered for the accounting. */
export function isDelivered(order: Pick<Order, 'status'>): boolean {
  return order.status === 'delivered' || order.status === 'completed'
}

export interface Settlement {
  delivered: number
  revenue: number
  driverEarnings: number
  /** Orders paid in cash: the driver collected the money. */
  cashCount: number
  /** Orders paid online: Abholance collected the money. */
  cardCount: number
  /** What the driver owes Abholance (cash orders). */
  owes: number
  /** What Abholance owes the driver (online orders). */
  credit: number
  /** credit - owes: positive = Abholance owes the driver. */
  saldo: number
  /** Delivered orders without price or payment method — not in the saldo. */
  skipped: number
}

type PricedOrder = Pick<
  Order,
  | 'status'
  | 'vehicle'
  | 'source'
  | 'return_trip'
  | 'amount'
  | 'payer'
  | 'payment_method'
  | 'pickup_district'
  | 'pickup_custom_location'
  | 'destination_district'
  | 'destination_custom_location'
>

export function settle(orders: PricedOrder[]): Settlement {
  const result: Settlement = {
    delivered: 0,
    revenue: 0,
    driverEarnings: 0,
    cashCount: 0,
    cardCount: 0,
    owes: 0,
    credit: 0,
    saldo: 0,
    skipped: 0,
  }

  for (const order of orders) {
    if (!isDelivered(order)) continue
    result.delivered += 1

    const gross = getOrderPrice(order)
    if (gross === null) {
      result.skipped += 1
      continue
    }
    const share = driverShare(gross)
    result.revenue += gross
    result.driverEarnings += share

    const method = paymentMethodOf(order)
    if (method === 'cash') {
      result.cashCount += 1
      result.owes += gross - share
    } else if (method === 'card') {
      result.cardCount += 1
      result.credit += share
    } else {
      result.skipped += 1
    }
  }

  result.revenue = round2(result.revenue)
  result.driverEarnings = round2(result.driverEarnings)
  result.owes = round2(result.owes)
  result.credit = round2(result.credit)
  result.saldo = round2(result.credit - result.owes)
  return result
}

export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
}

/** "Abholance schuldet dem Fahrer 12,00 €" / "Ausgeglichen". */
export function saldoText(saldo: number): string {
  if (saldo > 0.005) return `Abholance schuldet dem Fahrer ${formatEuro(saldo)}`
  if (saldo < -0.005) return `Fahrer schuldet Abholance ${formatEuro(-saldo)}`
  return 'Ausgeglichen'
}

/** Short version for the ranking row. */
export function saldoShort(saldo: number): { text: string; tone: 'owes' | 'credit' | 'even' } {
  if (saldo > 0.005) return { text: `Wir schulden ${formatEuro(saldo)}`, tone: 'credit' }
  if (saldo < -0.005) return { text: `Schuldet ${formatEuro(-saldo)}`, tone: 'owes' }
  return { text: 'Ausgeglichen', tone: 'even' }
}

// ----------------------------------------------------------------- periods

export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'all'

export const PERIOD_LABELS: Record<PeriodKind, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
  year: 'Jahr',
  all: 'Alle',
}

export interface PeriodRange {
  start: Date | null
  end: Date | null
  label: string
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Monday of the week containing `date`. */
function startOfWeek(date: Date) {
  const day = startOfDay(date)
  const offset = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - offset)
  return day
}

function isoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** The period `offset` steps away from now (0 = current, -1 = previous). */
export function periodRange(kind: PeriodKind, offset: number, now = new Date()): PeriodRange {
  const fmtShort = (d: Date) =>
    d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })

  if (kind === 'all') return { start: null, end: null, label: 'Gesamter Zeitraum' }

  if (kind === 'day') {
    const start = startOfDay(now)
    start.setDate(start.getDate() + offset)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return {
      start,
      end,
      label: start.toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  }

  if (kind === 'week') {
    const start = startOfWeek(now)
    start.setDate(start.getDate() + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const last = new Date(end)
    last.setDate(last.getDate() - 1)
    return {
      start,
      end,
      label: `KW ${isoWeek(start)} · ${fmtShort(start)}–${fmtShort(last)}`,
    }
  }

  if (kind === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    return {
      start,
      end,
      label: start.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' }),
    }
  }

  const start = new Date(now.getFullYear() + offset, 0, 1)
  const end = new Date(start.getFullYear() + 1, 0, 1)
  return { start, end, label: String(start.getFullYear()) }
}

export function inPeriod(iso: string | null, range: PeriodRange): boolean {
  if (!range.start || !range.end) return true
  if (!iso) return false
  const time = new Date(iso).getTime()
  return time >= range.start.getTime() && time < range.end.getTime()
}
