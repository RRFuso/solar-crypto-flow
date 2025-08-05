import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    
    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    if (!apiKey) {
      console.error('CoinGecko API key not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate endpoint to prevent SSRF attacks
    const allowedEndpoints = ['/coins/list', '/coins/markets', '/simple/price'];
    if (!allowedEndpoints.some(allowed => endpoint.startsWith(allowed))) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construct URL with parameters
    const url = new URL(`https://api.coingecko.com/api/v3${endpoint}`);
    
    // Add API key and other parameters
    url.searchParams.set('x_cg_demo_api_key', apiKey);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    console.log(`Fetching from CoinGecko: ${url.pathname}`);

    // Make request to CoinGecko API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoApp/1.0'
      }
    });

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});