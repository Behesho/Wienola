// Supabase Edge Function: e-mails the customer a Rechnung (invoice) with the
// company logo and the order details right after an order was placed.
//
// Called from the app with the customer's own session (JWT verification is
// on), so the order is read with the customer's permissions — no service
// role key involved. The e-mail is sent through Resend.
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   API key from resend.com
//   INVOICE_FROM     e.g. "Lasten-Wien <info@abholance-wien.at>" (domain must be verified in Resend)
// Optional:
//   SITE_URL         public URL of the app (used for the logo image)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const COMPANY = {
  name: 'Lasten-Wien',
  tagline: 'Liefer- & Transportservice',
  phone: '+43 660 6060819',
  email: 'info@abholance-wien.at',
  // Fill in for a legally complete invoice; empty lines are left out.
  address: '',
  vat: '',
  iban: '',
}

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
  created_at: string
  transport_type: string
  description: string | null
  vehicle: string | null
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

function addressLines(
  order: OrderRow,
  prefix: 'pickup' | 'destination',
): string[] {
  const district = order[`${prefix}_district`]
  const custom = order[`${prefix}_custom_location`]
  const street = order[`${prefix}_street`]
  const number = order[`${prefix}_house_number`]
  const stock = order[`${prefix}_stock`]
  const unit = order[`${prefix}_unit`]

  return [
    [street, number].filter(Boolean).join(' '),
    [stock && `Stock ${stock}`, unit && `Tür ${unit}`].filter(Boolean).join(' · '),
    district === 'other' ? custom : district,
  ].filter((line): line is string => Boolean(line))
}

function scheduleText(order: OrderRow): string {
  if (order.express || !order.scheduled_date) return 'So schnell wie möglich'
  const [y, m, d] = order.scheduled_date.split('-')
  const time = order.scheduled_time ? `, ${order.scheduled_time.slice(0, 5)} Uhr` : ''
  return `${d}.${m}.${y}${time}`
}

function buildInvoiceHtml(order: OrderRow, customerName: string, logoUrl: string) {
  const created = new Date(order.created_at)
  const dateText = created.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Vienna',
  })
  const invoiceNumber = `R-${created
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')}-${order.id.slice(0, 4).toUpperCase()}`

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;width:38%">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;vertical-align:top">${value}</td>
    </tr>`

  const lines = (values: string[]) =>
    values.map((line) => escapeHtml(line)).join('<br>')

  const details = [
    row('Auftragsart', escapeHtml(TRANSPORT_TYPE[order.transport_type] ?? order.transport_type)),
    order.vehicle ? row('Fahrzeug', escapeHtml(VEHICLE[order.vehicle] ?? order.vehicle)) : '',
    order.description ? row('Beschreibung', escapeHtml(order.description)) : '',
    row('Abholung', lines(addressLines(order, 'pickup'))),
    row('Zustellung', lines(addressLines(order, 'destination'))),
    row('Termin', escapeHtml(scheduleText(order))),
    order.payer ? row('Zahlung durch', escapeHtml(PAYER[order.payer] ?? order.payer)) : '',
  ].join('')

  let priceBlock: string
  if (order.amount !== null) {
    const gross = Number(order.amount)
    const net = gross / (1 + VAT_RATE)
    const vat = gross - net
    priceBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Nettobetrag</td><td align="right" style="padding:6px 0;font-size:14px;color:#111827">${eur(net)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">USt. ${VAT_RATE * 100} %</td><td align="right" style="padding:6px 0;font-size:14px;color:#111827">${eur(vat)}</td></tr>
        <tr><td style="padding:12px 0 0;border-top:2px solid #07e208;font-size:15px;font-weight:700;color:#111827">Gesamtbetrag (brutto)</td><td align="right" style="padding:12px 0 0;border-top:2px solid #07e208;font-size:20px;font-weight:800;color:#111827">${eur(gross)}</td></tr>
      </table>`
  } else {
    priceBlock = `<p style="margin:8px 0 0;font-size:14px;color:#111827"><strong>Preis:</strong> nach Vereinbarung</p>`
  }

  const companyLines = [
    COMPANY.address,
    COMPANY.vat && `UID: ${COMPANY.vat}`,
    COMPANY.iban && `IBAN: ${COMPANY.iban}`,
    `Tel. ${COMPANY.phone} · ${COMPANY.email}`,
  ].filter((line): line is string => Boolean(line))

  return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#262626;padding:22px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px"><img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="${COMPANY.name}" style="display:block;border-radius:10px"></td>
            <td>
              <div style="color:#07e208;font-size:20px;font-weight:800;letter-spacing:0.02em">${COMPANY.name.toUpperCase()}</div>
              <div style="color:#d1d5db;font-size:12px">${COMPANY.tagline}</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 4px;font-size:22px;color:#111827">Rechnung</h1>
          <p style="margin:0 0 20px;font-size:13px;color:#6b7280">Nr. ${invoiceNumber} · ${dateText}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#111827">Hallo ${escapeHtml(customerName)},<br>vielen Dank für deinen Auftrag. Hier sind die Details:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">${details}</table>
          ${priceBlock}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:18px 28px;font-size:12px;color:#6b7280;line-height:1.6">
          ${companyLines.map((line) => escapeHtml(line)).join('<br>')}
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
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://orangered-bee-793561.hostingersite.com'
    const html = buildInvoiceHtml(
      order,
      profile?.full_name || 'Kund_in',
      `${siteUrl}/logo-email.png`,
    )

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('INVOICE_FROM') ?? `${COMPANY.name} <${COMPANY.email}>`,
        to: [user.email],
        reply_to: COMPANY.email,
        subject: `Deine Rechnung – ${COMPANY.name}`,
        html,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Resend error:', detail)
      return json({ error: 'email failed', detail }, 502)
    }

    return json({ ok: true })
  } catch (error) {
    console.error(error)
    return json({ error: 'unexpected error' }, 500)
  }
})
