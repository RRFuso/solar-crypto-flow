import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

serve(async (req) => {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  const coingeckoPath = pathname.replace('/coingecko-proxy', '');
  const queryString = searchParams.toString();

  try {
    const response = await fetch(`${COINGECKO_API}${coingeckoPath}?${queryString}`);
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