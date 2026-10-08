import { EMPTY_ADDRESS, type AddressValue } from '../pages/Dashboard/NewOrder/types'

export interface ParsedOrderEmail {
  name: string
  phone: string
  email: string
  pickup: AddressValue
  destination: AddressValue
  /** Price in the mail, e.g. "17,00" → "17.00"; empty when not found. */
  amount: string
  /** Who pays, as written in the mail (Abholadresse / Zustelladresse). */
  payer: 'pickup' | 'destination' | ''
  express: boolean
  date: string
  time: string
  notes: string
}

type Field =
  | 'name'
  | 'phone'
  | 'email'
  | 'pickup'
  | 'destination'
  | 'amount'
  | 'payer'
  | 'when'
  | 'notes'

/** Label words (lowercase) that start a field in the order mails. */
const LABELS: [Field, RegExp][] = [
  ['pickup', /^(abholadresse|abholung|abholort|von)\b/],
  ['destination', /^(zustelladresse|zustellung|lieferadresse|zielort|ziel|nach)\b/],
  ['payer', /^(zahler|zahlung durch|zahlungspflichtig|bezahlt von|zahlungsart|zahlung)\b/],
  ['amount', /^(preis|betrag|gesamtbetrag|summe|kosten|gesamt)\b/],
  ['phone', /^(telefon|tel|handy|mobil|mobiltelefon|rufnummer)\b/],
  ['email', /^(e-mail|email|mail)\b/],
  ['name', /^(name|kunde|kundin|auftraggeber|auftraggeberin|absender|firma)\b/],
  ['when', /^(termin|datum|abholzeit|zeit|wann|abholtermin|uhrzeit)\b/],
  ['notes', /^(hinweis|hinweise|anmerkung|bemerkung|beschreibung|inhalt|info|notiz)\b/],
]

function matchLabel(line: string): { field: Field; rest: string } | null {
  const cleaned = line.replace(/^[\s*•\-–>]+/, '')
  const lower = cleaned.toLowerCase()
  for (const [field, pattern] of LABELS) {
    const m = lower.match(pattern)
    if (m) {
      const rest = cleaned.slice(m[0].length).replace(/^\s*[:=\-–]?\s*/, '')
      return { field, rest }
    }
  }
  return null
}

/** "1100 Wien", "1100", "11. Bezirk" → "1100 Wien"; '' when unknown. */
function findDistrict(text: string): string {
  const plz = text.match(/\b1(0[1-9]|1\d|2[0-3])0\b/)
  if (plz) return `1${plz[1]}0 Wien`
  const bezirk =
    text.match(/\b(\d{1,2})\s*\.?\s*Bezirk\b/i) ?? text.match(/\bBezirk\s*(\d{1,2})\b/i)
  if (bezirk) {
    const n = Number(bezirk[1])
    if (n >= 1 && n <= 23) return `1${String(n).padStart(2, '0')}0 Wien`
  }
  return ''
}

function parseAddress(raw: string): AddressValue {
  const address: AddressValue = { ...EMPTY_ADDRESS }
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return address

  address.district = findDistrict(text)

  // Drop district words so what is left is street + number.
  const withoutDistrict = text
    .replace(/\b1(0[1-9]|1\d|2[0-3])0\b/g, '')
    .replace(/\b\d{1,2}\s*\.?\s*Bezirk\b/gi, '')
    .replace(/\bBezirk\s*\d{1,2}\b/gi, '')
    .replace(/\bWien\b/gi, '')
    .replace(/\s*,\s*,/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')

  const streetPart = withoutDistrict.split(',')[0].trim()
  const m = streetPart.match(/^(.*?\D)\s*(\d+\s*[a-zA-Z]?(?:\s*[/-]\s*\d+\s*[a-zA-Z]?)*)\s*$/)
  if (m) {
    address.street = m[1].trim()
    address.houseNumber = m[2].replace(/\s+/g, '')
  } else {
    address.street = streetPart
  }
  return address
}

export function parseOrderEmail(source: string): ParsedOrderEmail {
  const result: ParsedOrderEmail = {
    name: '',
    phone: '',
    email: '',
    pickup: { ...EMPTY_ADDRESS },
    destination: { ...EMPTY_ADDRESS },
    amount: '',
    payer: '',
    express: false,
    date: '',
    time: '',
    notes: '',
  }

  const text = source.replace(/\r/g, '').replace(/ /g, ' ')
  const lines = text.split('\n').map((l) => l.trim())

  // Collect the value of each field: the text after its label plus any
  // following lines until the next label.
  const values: Partial<Record<Field, string[]>> = {}
  let current: Field | null = null
  for (const line of lines) {
    if (!line) {
      current = null
      continue
    }
    const hit = matchLabel(line)
    if (hit) {
      current = hit.field
      values[hit.field] = hit.rest ? [hit.rest] : []
    } else if (current) {
      values[current]!.push(line)
    }
  }
  const joined = (f: Field) => (values[f] ?? []).join(', ')

  result.pickup = parseAddress(joined('pickup'))
  result.destination = parseAddress(joined('destination'))

  // Price: a number next to a euro sign, anywhere in the mail.
  const amountText = joined('amount') || text
  const euro =
    amountText.match(/€\s*(\d+(?:[.,]\d{1,2})?)/) ??
    amountText.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur\b)/i)
  if (euro) result.amount = euro[1].replace(',', '.')

  const payerText = `${joined('payer')} ${text}`.toLowerCase()
  const payerLine = joined('payer').toLowerCase()
  if (/abhol/.test(payerLine)) result.payer = 'pickup'
  else if (/zustell|empf/.test(payerLine)) result.payer = 'destination'
  else if (/zahler[^\n]{0,20}abhol/.test(payerText)) result.payer = 'pickup'
  else if (/zahler[^\n]{0,20}zustell/.test(payerText)) result.payer = 'destination'

  // Phone: labelled value first, otherwise the first Austrian-looking number.
  const phoneSource = joined('phone') || text
  const phone = phoneSource.match(/(\+?\d[\d\s/\-()]{6,}\d)/)
  if (phone) result.phone = phone[1].replace(/\s+/g, ' ').trim()

  // E-mail: ignore the company's own address.
  const emails = (joined('email') + ' ' + text).match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []
  result.email = emails.find((e) => !/abholance-wien\.at$/i.test(e)) ?? ''

  result.name = joined('name').split(',')[0].trim()

  const when = `${joined('when')} ${text}`
  result.express = /heute\s*jetzt|sofort|so schnell|asap|express/i.test(when)
  const date = when.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/)
  if (date) {
    result.date = `${date[3]}-${date[2].padStart(2, '0')}-${date[1].padStart(2, '0')}`
  }
  const time = when.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (time) result.time = `${time[1].padStart(2, '0')}:${time[2]}`
  if (!result.date && !result.express) result.express = true

  result.notes = joined('notes')
  return result
}
