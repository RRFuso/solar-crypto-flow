import { serve } from 'https-deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

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
  const url = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`
  return await fetchJson<any[]>(url)
}

// Fetch stock data from Alpha Vantage
async function getStockData(symbol: string) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not found in environment variables.')
  }
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
  return fetchJson(url)
}

// Fetch commodity data from Alpha Vantage
async function getCommodityData(commodity: 'GOLD') {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not found in environment variables.')
  }
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=WGC/GOLD_DAILY_USD&apikey=${ALPHA_VANTAGE_API_KEY}`
  return fetchJson(url)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const [
      fearGreedIndex,
      longShortRatio,
      sp500,
      nasdaq,
      russell,
      nvidia,
      gold,
    ] = await Promise.all([
      getFearGreedIndex(),
      getLongShortRatio('BTCUSDT'),
      getStockData('SPY'), // SPDR S&P 500 ETF
      getStockData('QQQ'), // Invesco QQQ Trust (Nasdaq-100)
      getStockData('IWM'), // iShares Russell 2000 ETF
      getStockData('NVDA'),
      getCommodityData('GOLD'),
    ])

    const responseData = {
      fearGreedIndex: fearGreedIndex.data,
      longShortRatio,
      sp500,
      nasdaq,
      russell,
      nvidia,
      gold,
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
