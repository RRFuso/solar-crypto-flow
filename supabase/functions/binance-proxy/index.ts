import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

serve(async (req) => {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  const binancePath = pathname.replace('/binance-proxy', '');
  const queryString = searchParams.toString();

  try {
    const response = await fetch(`${BINANCE_API_URL}${binancePath}?${queryString}`);
    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
          'Cache-Control': 'public, max-age=60, s-maxage=60'
         },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})