import type { Order } from '../types/order'

/**
 * Zone-based price calculator (EUR, incl. USt). Prices are shown to drivers
 * only, so they can settle up with the customer — customers never see or
 * enter a price.
 *
 * Zones: "1"–"23" = Vienna districts, "KLN" = Klosterneuburg, "SST" = Seestadt.
 *
 *  - District -> district: PRICE_MATRIX[pickup][delivery].
 *  - Klosterneuburg = like district 19, Seestadt = like district 22, +7 EUR
 *    in both directions.
 *  - Same zone as pickup and delivery among KLN/SST: flat 12 EUR.
 *  - Prices exist for bike and car only.
 */

type Zone = string

const PRICE_MATRIX: number[][] = [
  [12,12,12,12,12,12,12,12,12,17,16,16,19,19,15,15,15,15,16,14,19,19,21],
  [12,12,12,12,14,13,13,13,13,17,16,17,18,21,16,16,16,16,16,12,17,17,21],
  [12,12,12,12,13,13,14,14,14,14,13,16,18,20,15,16,16,16,17,15,21,18,21],
  [12,12,12,12,12,12,13,13,14,14,16,15,17,18,14,16,16,16,16,16,21,19,18],
  [12,14,13,12,12,12,12,13,14,14,16,13,16,16,13,15,15,15,16,17,21,21,18],
  [12,13,13,12,12,12,12,12,13,15,17,14,16,17,12,14,14,15,16,16,21,21,18],
  [12,13,14,13,12,12,12,12,12,16,18,15,17,17,12,13,13,14,15,15,21,21,19],
  [12,13,14,13,13,12,12,12,12,16,18,15,17,17,13,12,12,12,14,14,21,21,19],
  [12,13,14,14,14,13,12,12,12,17,18,16,18,18,13,13,13,12,12,12,18,19,21],
  [17,17,14,14,14,15,16,16,17,12,14,14,17,19,15,17,17,18,21,19,23,21,16],
  [16,16,13,16,16,17,18,18,18,14,12,17,20,21,18,19,19,20,21,18,22,19,19],
  [16,17,16,15,13,14,15,15,16,14,17,12,13,16,13,15,16,17,18,18,22,21,14],
  [19,18,18,17,16,16,17,17,18,17,20,13,12,14,14,16,16,18,19,19,25,24,16],
  [19,21,20,18,16,17,17,17,18,19,21,16,14,12,13,15,16,17,19,20,24,24,21],
  [15,16,15,14,13,12,12,13,13,15,19,13,14,13,12,12,13,14,16,16,21,21,18],
  [15,16,16,16,15,14,13,12,13,17,19,15,16,15,12,12,12,13,15,16,20,21,20],
  [15,16,16,16,15,14,13,12,13,17,19,16,16,16,13,12,12,12,14,16,19,21,21],
  [15,16,16,16,15,15,14,12,12,18,20,17,18,17,14,13,12,12,12,13,18,21,21],
  [16,16,17,16,16,16,15,14,12,21,21,18,19,19,16,15,14,12,12,12,17,21,24],
  [14,12,15,16,17,16,15,14,12,19,18,18,19,20,16,16,16,13,12,12,15,15,22],
  [19,17,21,21,21,20,20,20,18,23,22,22,25,24,21,20,19,18,17,15,12,15,24],
  [19,17,18,19,20,20,20,20,19,21,21,24,24,24,21,20,20,20,20,15,15,12,23],
  [21,21,21,18,18,18,19,19,21,16,19,14,16,21,18,20,21,21,24,22,24,23,12],
]

const ZONES: Record<string, { refIndex: number }> = {
  KLN: { refIndex: 18 }, // like district 19
  SST: { refIndex: 21 }, // like district 22
}

const PRICED_VEHICLES = new Set(['bike', 'car'])

function isSpecialZone(zone: Zone) {
  return Object.prototype.hasOwnProperty.call(ZONES, zone)
}

function matrixIndex(zone: Zone) {
  return isSpecialZone(zone) ? ZONES[zone].refIndex : parseInt(zone, 10) - 1
}

/** Price of one leg from zone `from` to zone `to`, or null if invalid. */
export function legPrice(from: Zone, to: Zone): number | null {
  if (from === to && isSpecialZone(from)) return 12
  const i = matrixIndex(from)
  const j = matrixIndex(to)
  if (!(i >= 0 && i <= 22 && j >= 0 && j <= 22)) return null
  const surcharge = isSpecialZone(from) || isSpecialZone(to) ? 7 : 0
  return PRICE_MATRIX[i][j] + surcharge
}

/**
 * Zone from a place text: "Klosterneuburg" or postcode 3400 -> KLN,
 * anything mentioning "Seestadt" -> SST, Vienna postcodes 1010..1230 -> 1..23.
 * Returns null when the zone can't be determined (no price then).
 */
export function zoneFromPlace(text: string | null): Zone | null {
  if (!text) return null
  if (/\bseestadt\b/i.test(text)) return 'SST'
  if (/\bklosterneuburg\b/i.test(text)) return 'KLN'
  for (const plz of text.match(/\b\d{4}\b/g) ?? []) {
    if (plz === '3400') return 'KLN'
    const match = plz.match(/^1(0[1-9]|1\d|2[0-3])0$/)
    if (match) return String(parseInt(match[1], 10))
  }
  return null
}

function orderZone(district: string | null, customLocation: string | null) {
  return zoneFromPlace(district === 'other' ? customLocation : district)
}

/**
 * Price shown to the driver: the zone price for bike/car orders. Falls back
 * to a legacy customer-entered `amount` on older orders; null when there is
 * no price (van/truck, or a zone outside the price table).
 */
export function getOrderPrice(
  order: Pick<
    Order,
    | 'vehicle'
    | 'amount'
    | 'pickup_district'
    | 'pickup_custom_location'
    | 'destination_district'
    | 'destination_custom_location'
  >,
): number | null {
  if (order.vehicle && PRICED_VEHICLES.has(order.vehicle)) {
    const from = orderZone(order.pickup_district, order.pickup_custom_location)
    const to = orderZone(
      order.destination_district,
      order.destination_custom_location,
    )
    if (from && to) {
      const price = legPrice(from, to)
      if (price !== null) return price
    }
  }
  return order.amount
}

const VIENNA_POSTCODES = Array.from(
  { length: 23 },
  (_, i) => `1${String(i + 1).padStart(2, '0')}0`,
)

/** Every selectable zone, for the customer price calculator and price list. */
export const ZONE_OPTIONS: { value: Zone; label: string }[] = [
  ...VIENNA_POSTCODES.map((plz, i) => ({
    value: String(i + 1),
    label: `${i + 1}. Bezirk (${plz})`,
  })),
  { value: 'KLN', label: 'Klosterneuburg' },
  { value: 'SST', label: 'Seestadt Aspern' },
]

export function zoneName(zone: Zone): string {
  return ZONE_OPTIONS.find((option) => option.value === zone)?.label ?? zone
}

export interface PriceLine {
  label: string
  amount: number
}

export interface Quote {
  total: number | null
  lines: PriceLine[]
}

/**
 * Quote for the customer calculator.
 *  - Zusatzstopp lies behind the delivery: same zone +6 EUR, otherwise the
 *    leg price from the delivery zone.
 *  - Rückweg leads from the last point back (to the pickup zone when
 *    `returnTo` is "back", otherwise to the chosen zone) at half price.
 */
export function computeQuote(input: {
  pickup: Zone
  delivery: Zone
  extraStop: Zone
  returnTo: Zone | 'back'
}): Quote {
  const lines: PriceLine[] = []
  if (!input.pickup || !input.delivery) return { total: null, lines }

  const base = legPrice(input.pickup, input.delivery)
  if (base === null) return { total: null, lines }
  lines.push({
    label: `${zoneName(input.pickup)} → ${zoneName(input.delivery)}`,
    amount: base,
  })
  let total = base
  let current = input.delivery

  if (input.extraStop) {
    const amount =
      input.extraStop === current ? 6 : legPrice(current, input.extraStop)
    if (amount !== null) {
      lines.push({ label: `Zusatzstopp: ${zoneName(input.extraStop)}`, amount })
      total += amount
      current = input.extraStop
    }
  }

  if (input.returnTo) {
    const target = input.returnTo === 'back' ? input.pickup : input.returnTo
    const full = target === current ? 6 : legPrice(current, target)
    if (full !== null) {
      const amount = Math.round((full / 2) * 100) / 100
      lines.push({ label: `Rückweg: ${zoneName(target)} (½ Preis)`, amount })
      total += amount
    }
  }

  return { total, lines }
}
