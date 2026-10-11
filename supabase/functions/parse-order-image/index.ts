// Supabase Edge Function: reads a photo/screenshot of an order (e.g. the
// abholance-wien.at e-mail) with Claude and returns it as plain labelled
// text ("Kunde: …", "Abholadresse: …"), which the app's order-import page
// then fills into its form.
//
// Only admins may call it (profiles.is_admin, read with the caller's own JWT
// — no service role key involved).
//
// Required secret (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY   from console.anthropic.com
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MODEL = 'claude-sonnet-5'

const PROMPT = `Das Bild zeigt eine Bestellung für einen Botendienst in Wien (z. B. eine E-Mail oder ein Screenshot).
Lies sie ab und gib NUR die folgenden Zeilen aus, ohne Erklärung, ohne Markdown.
Lass eine Zeile weg, wenn die Angabe im Bild nicht vorkommt. Erfinde nichts.

Kunde: <Name des Kunden / der Firma>
Telefon: <Telefonnummer des Kunden>
E-Mail: <E-Mail des Kunden, nicht info@abholance-wien.at>
Abholadresse: <Straße Hausnummer, PLZ Wien>
Zustelladresse: <Straße Hausnummer, PLZ Wien>
Termin: <z. B. "heute jetzt" oder "12.10.2026 14:30">
Preis: <z. B. "€ 17,00">
Zahler: <Abholadresse oder Zustelladresse>
Hinweis: <Zusatzinfos für den Fahrer, falls vorhanden>`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { image } = await request.json()
    const match = typeof image === 'string' && image.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
    if (!match) return json({ error: 'image missing' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return json({ error: 'not signed in' }, 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .maybeSingle()
    if (!profile?.is_admin) return json({ error: 'admins only' }, 403)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: match[1], data: match[2] },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Anthropic error:', detail)
      return json({ error: 'ai failed', detail }, 502)
    }

    const result = await response.json()
    const text = (result.content ?? [])
      .filter((part: { type: string }) => part.type === 'text')
      .map((part: { text: string }) => part.text)
      .join('\n')
      .trim()

    return json({ text })
  } catch (error) {
    console.error(error)
    return json({ error: 'unexpected error' }, 500)
  }
})
