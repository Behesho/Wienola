// Supabase Edge Function: e-mails the customer a Rechnung (invoice) in the
// Abholance Wien layout right after an order was placed.
//
// Called from the app with the customer's own session (JWT verification is
// on), so the order is read with the customer's permissions — no service
// role key involved. The e-mail is sent from the company's own mailbox over
// SMTP (no third-party mail service).
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   SMTP_HOST   e.g. smtp.hostinger.com
//   SMTP_PORT   465
//   SMTP_USER   info@abholance-wien.at
//   SMTP_PASS   password of that mailbox
// Optional:
//   SITE_URL    public URL of the app (the logo image is loaded from there)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const COMPANY = {
  name: 'Abholance Wien',
  taglineLeft: 'Lokaler Botendienst in Wien',
  taglineRight: 'Schnell abgeholt , Sicher zugestellt',
  phone: '+43 660 6060 819',
  email: 'info@abholance-wien.at',
  website: 'www.abholance-wien.at',
  vat: 'ATU79705678',
  accountHolder: 'Ali Feyzi',
  bank: 'Erste Bank',
  iban: 'AT15 2011 1857 7446 1300',
}

const YELLOW = '#ffd801'
const VAT_RATE = 0.2

const TRANSPORT_TYPE: Record<string, string> = {
  moving: 'Kompletter Umzug',
  multiple: 'Mehrere Gegenstände',
  single: 'Einzelstück',
  disposal: 'Entsorgung',
  letter: 'Brief / Post',
  courier: 'Kurier',
  valuable: 'Werttransport',
  other: 'Sonstiges',
  willhaben: 'Willhaben-Abholung',
  billa: 'Billa Click & Collect',
}

const VEHICLE: Record<string, string> = {
  bike: 'Fahrrad',
  car: 'PKW',
  van: 'Transporter',
  truck: 'LKW',
}

const PAYER: Record<string, string> = {
  pickup: 'Abholadresse',
  destination: 'Zustelladresse',
}

interface OrderRow {
  id: string
  customer_id: string
  created_at: string
  transport_type: string
  description: string | null
  vehicle: string | null
  contact_phone: string | null
  pickup_district: string | null
  pickup_custom_location: string | null
  pickup_street: string | null
  pickup_house_number: string | null
  pickup_stock: string | null
  pickup_unit: string | null
  destination_district: string | null
  destination_custom_location: string | null
  destination_street: string | null
  destination_house_number: string | null
  destination_stock: string | null
  destination_unit: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  express: boolean
  payer: string | null
  amount: number | null
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const eur = (value: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(
    value,
  )

/** "Hauptstraße 12/3/7, 1010 Wien" on one line. */
function addressLine(order: OrderRow, prefix: 'pickup' | 'destination'): string {
  const district = order[`${prefix}_district`]
  const custom = order[`${prefix}_custom_location`]
  const street = order[`${prefix}_street`]
  const number = order[`${prefix}_house_number`]
  const stock = order[`${prefix}_stock`]
  const unit = order[`${prefix}_unit`]

  const streetPart = [street, number].filter(Boolean).join(' ')
  const detailPart = [stock && `Stock ${stock}`, unit && `Tür ${unit}`]
    .filter(Boolean)
    .join(', ')
  const place = district === 'other' ? custom : district

  return [streetPart, detailPart, place].filter(Boolean).join(', ')
}

function scheduleText(order: OrderRow): string {
  if (order.express || !order.scheduled_date) return 'So schnell wie möglich'
  const [y, m, d] = order.scheduled_date.split('-')
  const time = order.scheduled_time ? `, ${order.scheduled_time.slice(0, 5)} Uhr` : ''
  return `${d}.${m}.${y}${time}`
}

interface InvoiceInput {
  order: OrderRow
  customerName: string
  customerPhone: string | null
  logoUrl: string
}

function buildInvoiceHtml({ order, customerName, customerPhone, logoUrl }: InvoiceInput) {
  const created = new Date(order.created_at)
  const issued = `${created.toLocaleDateString('de-AT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Vienna',
  })}, ${created.toLocaleTimeString('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna',
  })} Uhr`

  const invoiceNumber = `R-${created
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')}-${order.id.slice(0, 4).toUpperCase()}`
  const customerNumber = `K-${order.customer_id.slice(0, 6).toUpperCase()}`

  const pickup = addressLine(order, 'pickup')
  const destination = addressLine(order, 'destination')
  const phone = order.contact_phone || customerPhone

  const service = [
    `Botendienst: ${order.description || TRANSPORT_TYPE[order.transport_type] || order.transport_type}`,
  ]
  const serviceMeta = [
    `Auftragsart: ${TRANSPORT_TYPE[order.transport_type] ?? order.transport_type}`,
    order.vehicle ? `Fahrzeug: ${VEHICLE[order.vehicle] ?? order.vehicle}` : '',
    `Termin: ${scheduleText(order)}`,
    order.payer ? `Zahlung durch: ${PAYER[order.payer] ?? order.payer}` : '',
  ].filter(Boolean)

  let priceCells: string
  if (order.amount !== null) {
    const gross = Number(order.amount)
    const net = gross / (1 + VAT_RATE)
    const vat = gross - net
    priceCells = `
      <tr><td style="border:1px solid #9a9a9a;background:#ffffff;padding:10px 4px;text-align:center;font-size:11px;font-weight:700;color:#111;line-height:1.6">
        Netto ${eur(net)}<br>${VAT_RATE * 100}% USt ${eur(vat)}
      </td></tr>
      <tr><td style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="background:${YELLOW};border:1px solid #9a9a9a;padding:12px 4px;text-align:center;font-size:18px;font-weight:800;color:#111">${eur(gross)}</td></tr>`
  } else {
    priceCells = `
      <tr><td style="background:${YELLOW};border:1px solid #9a9a9a;padding:18px 4px;text-align:center;font-size:12px;font-weight:800;color:#111">Preis nach Vereinbarung</td></tr>`
  }

  const box = (label: string, value: string) => `
    <tr><td style="padding:0 0 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #9a9a9a;background:#ffffff">
        <tr><td style="padding:10px 12px;font-size:14px;color:#333"><strong style="color:#111">${label}:</strong> ${escapeHtml(value)}</td></tr>
      </table>
    </td></tr>`

  const grey = '#d9d9d9'

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rechnung</title>
</head>
<body style="margin:0;padding:0;background:#e9e9e9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e9e9;padding:8px 4px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#f0efee">

        <!-- Header -->
        <tr><td style="background:${YELLOW};padding:10px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #444">
            <tr>
              <td width="34%" align="center" style="padding:10px 6px;font-size:12px;font-weight:700;color:#3d3d3d">${COMPANY.taglineLeft}</td>
              <td width="32%" align="center" style="padding:12px 0 4px"><img src="${escapeHtml(logoUrl)}" width="96" height="96" alt="${COMPANY.name}" style="display:block;border:0"></td>
              <td width="34%" align="center" style="padding:10px 6px;font-size:12px;font-weight:700;color:#3d3d3d">${COMPANY.taglineRight}</td>
            </tr>
            <tr><td colspan="3" align="center" style="padding:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:900;color:#3a3a1a;letter-spacing:0.01em">${COMPANY.name}</td></tr>
          </table>
        </td></tr>

        <!-- Kunde + RECHNUNG -->
        <tr><td style="padding:24px 16px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" style="font-size:14px;color:#333;line-height:1.5">
              <div style="font-weight:700;color:#555">Kunde:</div>
              <div style="font-weight:700;color:#555">${escapeHtml(customerName)}</div>
              ${pickup ? `<div style="font-weight:700;color:#111">${escapeHtml(pickup)}</div>` : ''}
              ${phone ? `<div>Tel: ${escapeHtml(phone)}</div>` : ''}
            </td>
            <td valign="middle" align="right" style="font-size:24px;font-weight:900;color:#3a3a3a">RECHNUNG</td>
          </tr></table>
        </td></tr>

        <!-- Rechnungsnummer / Kundennummer / Datum -->
        <tr><td style="padding:0 12px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #9a9a9a;background:${grey}">
            <tr>
              <td width="32%" style="padding:10px 6px;font-size:10px;font-weight:700;color:#555">Rechnungsnummer:</td>
              <td width="30%" align="center" style="padding:10px 4px;font-size:10px;font-weight:700;color:#555">Kundennummer:</td>
              <td width="38%" align="right" style="padding:10px 6px;font-size:10px;font-weight:700;color:#555">Datum der Ausstellung:</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #9a9a9a;border-top:0;background:${grey}">
            <tr>
              <td width="32%" style="padding:10px 6px;font-size:11px;font-weight:700;color:#222">${invoiceNumber}</td>
              <td width="30%" align="center" style="padding:10px 4px;font-size:11px;font-weight:700;color:#222">${customerNumber}</td>
              <td width="38%" align="right" style="padding:10px 6px;font-size:10px;font-weight:700;color:#222">${escapeHtml(issued)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Leistung + Preis -->
        <tr><td style="padding:0 12px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" width="66%" style="padding-right:8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="background:#4a4a4a;padding:14px 4px;font-size:11px;font-weight:700;color:#ffffff">LEISTUNGSBESCHREIBUNG</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>
                <tr><td style="border:1px solid #9a9a9a;background:#ffffff;padding:14px 8px;font-size:13px;color:#333;line-height:1.7" align="center">
                  ${service.map((line) => escapeHtml(line)).join('<br>')}
                  <div style="margin-top:8px;font-size:12px;color:#666">${serviceMeta.map((line) => escapeHtml(line)).join('<br>')}</div>
                </td></tr>
              </table>
            </td>
            <td valign="top" width="34%">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="background:#4a4a4a;padding:14px 4px;font-size:9px;font-weight:700;color:#ffffff">VERSANDKOSTEN INKL MWST</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>
                ${priceCells}
              </table>
            </td>
          </tr></table>
        </td></tr>

        <!-- Adressen -->
        <tr><td style="padding:8px 12px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${box('Abholadresse', pickup)}
            ${box('Zustelladresse', destination)}
          </table>
        </td></tr>

        <!-- Zahlungsdetails -->
        <tr><td style="padding:20px 16px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" style="font-size:13px;color:#333;line-height:1.9">
              <div style="font-size:16px;font-weight:700;letter-spacing:0.12em;color:#222;margin-bottom:6px">ZAHLUNGSDETAILS</div>
              <strong>Kontoinhaber:</strong> ${COMPANY.accountHolder}<br>
              <strong>Name der Bank:</strong> ${COMPANY.bank}<br>
              <strong>IBAN:</strong> ${COMPANY.iban}
            </td></tr>
            <tr><td valign="bottom" style="padding-top:12px;font-size:13px;color:#333;line-height:1.9">
              <strong>UID Nummer: ${COMPANY.vat}</strong><br>
              <strong>${COMPANY.phone}</strong><br>
              <strong>${COMPANY.email}</strong>
            </td>
          </tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 0 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #555;background:#f0efee">
            <tr><td align="center" style="padding:16px 8px;font-size:12px;color:#222">Telefon: ${COMPANY.phone} &nbsp;|&nbsp; E-Mail: ${COMPANY.email} &nbsp;|&nbsp; Webseite: ${COMPANY.website}</td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await request.json()
    if (!orderId) return json({ error: 'orderId missing' }, 400)

    const authorization = request.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authorization } } },
    )

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user?.email) return json({ error: 'not signed in' }, 401)

    // RLS: a customer can only read their own orders.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .maybeSingle<OrderRow>()
    if (orderError || !order) return json({ error: 'order not found' }, 404)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()

    const siteUrl =
      Deno.env.get('SITE_URL') ?? 'https://orangered-bee-793561.hostingersite.com'
    const html = buildInvoiceHtml({
      order,
      customerName: profile?.full_name || 'Kund_in',
      customerPhone: profile?.phone ?? null,
      logoUrl: `${siteUrl}/logo-email.png`,
    })

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.hostinger.com',
        port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER') ?? COMPANY.email,
          password: Deno.env.get('SMTP_PASS') ?? '',
        },
      },
    })

    try {
      await client.send({
        from: `${COMPANY.name} <${Deno.env.get('SMTP_USER') ?? COMPANY.email}>`,
        to: user.email,
        replyTo: COMPANY.email,
        subject: `Deine Rechnung – ${COMPANY.name}`,
        content: 'Bitte öffne diese E-Mail in einem HTML-fähigen Programm.',
        html,
      })
    } finally {
      await client.close()
    }

    return json({ ok: true })
  } catch (error) {
    console.error(error)
    return json({ error: 'unexpected error' }, 500)
  }
})
