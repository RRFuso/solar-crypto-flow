import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getCache, setCache, getOrFetch, CacheKeys, CacheTTL } from '../_shared/redis.ts'

const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY')
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// Helper to build query strings
function buildQueryString(params: Record<string, any>): string {
  return new URLSearchParams(params).toString()
}

// --- Cache-first ticker ID lookup ---
async function findCoingeckoId(ticker: string): Promise<string | null> {
  const cacheKey = `coingecko:id:${ticker.toLowerCase()}`;
  
  // Try cache first
  const cached = await getCache<string>(cacheKey);
  if (cached) return cached;

  try {
    const searchUrl = `${COINGECKO_API_URL}/search?query=${ticker}`
    const response = await fetch(searchUrl, {
      headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY || '' },
    })
    if (!response.ok) return null

    const data = await response.json()
    const bestMatch = data.coins?.find((c: any) => c.symbol.toUpperCase() === ticker.toUpperCase())
    const id = bestMatch?.id || data.coins?.[0]?.id || null;
    
    // Cache the ID for 24 hours (IDs don't change)
    if (id) {
      await setCache(cacheKey, id, 86400);
    }
    
    return id;
  } catch (error) {
    console.error(`Error searching for ticker ${ticker}:`, error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, params, tickers } = await req.json()

    if (!COINGECKO_API_KEY) {
      throw new Error('CoinGecko API key not found in environment variables.')
    }

    // Type 1: Request for specific ticker prices (from AI tool)
    if (tickers && Array.isArray(tickers) && tickers.length > 0) {
      const cacheKey = `coingecko:prices:${tickers.sort().join(',')}`;
      
      // Try cache first (60 second TTL for prices)
      const cachedPrices = await getCache<Record<string, any>>(cacheKey);
      if (cachedPrices) {
        console.log('[Redis] Returning cached ticker prices');
        return new Response(JSON.stringify(cachedPrices), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const tickerToIdMap = new Map<string, string>()
      const idsToFetch: string[] = []
      
      // Find the correct ID for each ticker (cached)
      for (const ticker of tickers) {
        const foundId = await findCoingeckoId(ticker)
        if (foundId) {
          tickerToIdMap.set(ticker, foundId)
          idsToFetch.push(foundId)
        }
      }

      const remappedData: Record<string, any> = {}
      
      if (idsToFetch.length > 0) {
        const queryParams = buildQueryString({
          ids: idsToFetch.join(','),
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
          include_24hr_change: 'true',
        })
        const priceUrl = `${COINGECKO_API_URL}/simple/price?${queryParams}`
        const priceResponse = await fetch(priceUrl, {
          headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
        })

        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          for (const [ticker, id] of tickerToIdMap.entries()) {
            if (priceData[id]) {
              remappedData[ticker] = priceData[id]
            }
          }
        }
      }

      for (const ticker of tickers) {
        if (!remappedData[ticker]) {
          remappedData[ticker] = { error: 'Data not found for this ticker.' }
        }
      }

      // Cache for 60 seconds
      await setCache(cacheKey, remappedData, CacheTTL.PRICE_STANDARD);

      return new Response(JSON.stringify(remappedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    // Type 2: Generic proxy request (from the main application)
    else if (endpoint) {
      const queryParams = params ? buildQueryString(params) : ''
      const cacheKey = `coingecko:endpoint:${endpoint}:${queryParams}`;
      
      // Determine TTL based on endpoint
      let ttl = CacheTTL.MARKET_DATA;
      if (endpoint.includes('/simple/price')) {
        ttl = CacheTTL.PRICE_STANDARD;
      } else if (endpoint.includes('/coins/markets')) {
        ttl = CacheTTL.MARKET_DATA;
      } else if (endpoint.includes('/coins/') && endpoint.includes('/market_chart')) {
        ttl = CacheTTL.HISTORICAL;
      }

      // Try cache first
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData) {
        console.log(`[Redis] Returning cached data for ${endpoint}`);
        return new Response(JSON.stringify(cachedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const finalUrl = `${COINGECKO_API_URL}${endpoint}?${queryParams}`
      const response = await fetch(finalUrl, {
        headers: {
          'x-cg-demo-api-key': COINGECKO_API_KEY,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`CoinGecko API request to ${finalUrl} failed:`, errorBody)
        throw new Error(`CoinGecko API request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Cache the response
      await setCache(cacheKey, data, ttl);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // Type 3: Invalid request
    else {
      return new Response(JSON.stringify({ error: 'Request must include either "tickers" or "endpoint".' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

  } catch (err: unknown) {
    console.error('Error in secure-coingecko-proxy:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})