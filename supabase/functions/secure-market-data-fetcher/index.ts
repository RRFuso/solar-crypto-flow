import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Helper to fetch and parse JSON
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Failed to fetch data from ${url}: ${response.statusText}`, errorBody)
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`)
  }
  return response.json()
}

// Fetch Fear & Greed Index
async function getFearGreedIndex() {
  return await fetchJson<{ data: any[] }>('https://api.alternative.me/fng/?limit=10')
}

// Fetch Long/Short Ratio from Binance
async function getLongShortRatio(symbol = 'BTCUSDT', period = '1h') {
  const url = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=30`
  return await fetchJson<any[]>(url)
}

// Fetch Bitcoin ETF data from Dune Analytics
async function getBtcEtfFlow() {
  const DUNE_API_KEY = Deno.env.get('DUNE_API_KEY')
  if (!DUNE_API_KEY) {
    console.warn('DUNE_API_KEY not configured')
    return null
  }

  try {
    // Using Dune query for Bitcoin ETF flows
    // Query ID: 4245527 (Bitcoin ETF Holdings and Flows)
    const response = await fetch('https://api.dune.com/api/v1/query/4245527/results', {
      headers: {
        'x-dune-api-key': DUNE_API_KEY,
      },
    })

    if (!response.ok) {
      console.error('Dune API error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data?.result?.rows || null
  } catch (error) {
    console.error('Error fetching BTC ETF data from Dune:', error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Helper to wrap promises with error handling
  const fetchWithErrorHandling = async <T>(
    promise: Promise<T>,
    identifier: string
  ): Promise<T | null> => {
    try {
      return await promise
    } catch (error) {
      console.error(`Error fetching ${identifier}:`, error.message)
      return null // Return null on failure
    }
  }

  try {
    const [
      fearGreedIndex,
      longShortRatio,
      btcEtfFlow,
    ] = await Promise.all([
      fetchWithErrorHandling(getFearGreedIndex(), 'Fear & Greed Index'),
      fetchWithErrorHandling(getLongShortRatio('BTCUSDT'), 'Long/Short Ratio'),
      fetchWithErrorHandling(getBtcEtfFlow(), 'BTC ETF Flow'),
    ])

    const responseData = {
      fearGreedIndex: fearGreedIndex?.data,
      longShortRatio,
      btcEtfFlow,
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    // This outer catch is now for more general errors, 
    // as individual fetch errors are handled.
    console.error('General error in market data fetcher:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
