import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  volume_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
}

// Rate limiting map (IP -> { count, resetTime })
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      console.log(`[Cache] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 100 requests per minute.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    console.log(`[Cache] Request from IP: ${clientIp}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Fetch only necessary columns
    const { data, error } = await supabaseClient
      .from('cryptocurrencies')
      .select('id, symbol, name, current_price, volume_24h, price_change_percentage_24h, market_cap')
      .order('market_cap', { ascending: false })
      .limit(250);

    if (error) {
      console.error('[Cache] Database error:', error);
      throw error;
    }

    console.log(`[Cache] Fetched ${data?.length || 0} crypto prices`);

    // Separate data into price data and metadata
    const priceData: CryptoPriceData[] = data || [];
    
    // Different cache times for different data types
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      // Price data: 10 seconds cache
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      'X-Cache-Status': 'MISS',
      'X-Data-Count': String(priceData.length)
    };

    return new Response(
      JSON.stringify({ data: priceData }),
      { 
        status: 200, 
        headers 
      }
    );

  } catch (error) {
    console.error('[Cache] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
