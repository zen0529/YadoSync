import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BEDS24_BASE_URL = 'https://api.beds24.com/v2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getAccessToken = async (refreshToken) => {
  const res = await fetch(`${BEDS24_BASE_URL}/authentication/token`, {
    headers: {
      'Content-Type': 'application/json',
      'refreshToken': refreshToken,
    },
  })
  if (!res.ok) throw new Error(`Beds24 auth failed: ${res.status}`)
  const data = await res.json()
  if (!data.token) throw new Error('Beds24 did not return an access token')
  return data.token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { beds24PropertyId } = await req.json()
    if (!beds24PropertyId) throw new Error('beds24PropertyId is required')

    const refreshToken = Deno.env.get('BEDS24_REFRESH_TOKEN')
    if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN secret not set')

    const accessToken = await getAccessToken(refreshToken)

    const res = await fetch(`${BEDS24_BASE_URL}/properties/${beds24PropertyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'token': accessToken,
      },
    })
    if (!res.ok) throw new Error(`Beds24 deleteProperty failed: ${res.status}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
