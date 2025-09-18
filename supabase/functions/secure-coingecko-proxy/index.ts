import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY')
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// Helper to build query strings
function buildQueryString(params: Record<string, any>): string {
  return new URLSearchParams(params).toString()
}

// --- New, more robust function to find a CoinGecko ID from a ticker ---
async function findCoingeckoId(ticker: string): Promise<string | null> {
  try {
    const searchUrl = `${COINGECKO_API_URL}/search?query=${ticker}`
    const response = await fetch(searchUrl, {
      headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY },
    })
    if (!response.ok) return null

    const data = await response.json()
    // Find the best match: often the one where the symbol matches the ticker exactly
    const bestMatch = data.coins?.find((c: any) => c.symbol.toUpperCase() === ticker.toUpperCase())
    
    return bestMatch?.id || data.coins?.[0]?.id || null
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

    // --- Logic to handle different request types ---

    // Type 1: Request for specific ticker prices (from AI tool)
    if (tickers && Array.isArray(tickers) && tickers.length > 0) {
      const tickerToIdMap = new Map<string, string>()
      const idsToFetch: string[] = []
      
      // Find the correct ID for each ticker
      for (const ticker of tickers) {
        const foundId = await findCoingeckoId(ticker)
        if (foundId) {
          tickerToIdMap.set(ticker, foundId)
          idsToFetch.push(foundId)
        }
      }

      const remappedData: Record<string, any> = {}
      
      // If we found any valid IDs, fetch their price data
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
          // Map the results back to the original tickers
          for (const [ticker, id] of tickerToIdMap.entries()) {
            if (priceData[id]) {
              remappedData[ticker] = priceData[id]
            }
          }
        }
      }

      // Add error messages for tickers that were not found
      for (const ticker of tickers) {
        if (!remappedData[ticker]) {
          remappedData[ticker] = { error: 'Data not found for this ticker.' }
        }
      }

      return new Response(JSON.stringify(remappedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    // Type 2: Generic proxy request (from the main application)
    else if (endpoint) {
      const queryParams = params ? buildQueryString(params) : ''
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

  } catch (err) {
    console.error('Error in secure-coingecko-proxy:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
