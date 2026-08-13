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
      // Normalize: "ZEREBRO-USD", "$zerebro" -> "ZEREBRO"
      const normalize = (t: string) =>
        String(t).trim().replace(/^\$/, '').replace(/[-/](USD|USDT|BRL|EUR)$/i, '').toUpperCase();

      const normalizedTickers = [...new Set(tickers.map(normalize))].filter(Boolean);
      const cacheKey = `coingecko:markets:${[...normalizedTickers].sort().join(',')}`;

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
      for (const ticker of normalizedTickers) {
        const foundId = await findCoingeckoId(ticker)
        if (foundId) {
          tickerToIdMap.set(ticker, foundId)
          idsToFetch.push(foundId)
        }
      }

      const remappedData: Record<string, any> = {}
      
      if (idsToFetch.length > 0) {
        // /coins/markets gives full data (price, mcap, rank, volume, ATH, multi-window changes)
        const queryParams = buildQueryString({
          vs_currency: 'usd',
          ids: idsToFetch.join(','),
          sparkline: 'false',
          price_change_percentage: '1h,24h,7d,30d',
        })
        const marketsUrl = `${COINGECKO_API_URL}/coins/markets?${queryParams}`
        const marketsResponse = await fetch(marketsUrl, {
          headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
        })

        if (marketsResponse.ok) {
          const marketsData = await marketsResponse.json()
          const byId = new Map<string, any>((marketsData || []).map((c: any) => [c.id, c]))
          for (const [ticker, id] of tickerToIdMap.entries()) {
            const coin = byId.get(id)
            if (coin) {
              remappedData[ticker] = {
                coingecko_id: coin.id,
                name: coin.name,
                symbol: (coin.symbol || '').toUpperCase(),
                usd: coin.current_price,
                usd_market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                usd_24h_vol: coin.total_volume,
                usd_24h_change: coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h,
                usd_1h_change: coin.price_change_percentage_1h_in_currency,
                usd_7d_change: coin.price_change_percentage_7d_in_currency,
                usd_30d_change: coin.price_change_percentage_30d_in_currency,
                high_24h: coin.high_24h,
                low_24h: coin.low_24h,
                ath: coin.ath,
                ath_change_percentage: coin.ath_change_percentage,
                circulating_supply: coin.circulating_supply,
                total_supply: coin.total_supply,
                fully_diluted_valuation: coin.fully_diluted_valuation,
                image: coin.image,
                last_updated: coin.last_updated,
                source: 'CoinGecko /coins/markets',
              }
            }
          }
        } else {
          console.error('CoinGecko markets request failed:', await marketsResponse.text())
        }
      }

      for (const ticker of normalizedTickers) {
        if (!remappedData[ticker]) {
          remappedData[ticker] = {
            error: 'Data not found for this ticker.',
            note: 'Ticker não encontrado na CoinGecko (pode ser token muito novo, de nicho ou com símbolo diferente).',
          }
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