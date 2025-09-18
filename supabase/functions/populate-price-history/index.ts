import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Binance k-line data structure
// [
//   1499040000000,      // Open time
//   "0.01634710",       // Open
//   "0.80000000",       // High
//   "0.01575800",       // Low
//   "0.01577100",       // Close
//   "148976.11427815",  // Volume
//   1499644799999,      // Close time
//   "2434.19055334",    // Quote asset volume
//   308,                // Number of trades
//   "1756.87402397",    // Taker buy base asset volume
//   "28.46694368",      // Taker buy quote asset volume
//   "17928899.62484339" // Ignore.
// ]
type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json() // e.g., "AVAXUSDT"
    if (!symbol) {
      throw new Error("Missing 'symbol' in request body")
    }

    console.log(`Fetching 90 days of history for ${symbol}...`)

    // 1. Fetch historical data from Binance
    // We'll fetch daily data for the last 90 days.
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1d&limit=90`
    const response = await fetch(binanceUrl)
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${await response.text()}`)
    }
    const klines: BinanceKline[] = await response.json()
    console.log(`Fetched ${klines.length} records from Binance.`)

    // 2. Format data for Supabase
    const historyRows = klines.map(kline => ({
      symbol: symbol.replace('USDT', ''), // Store as "AVAX" not "AVAXUSDT"
      timestamp: new Date(kline[0]).toISOString(),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }))

    // 3. Insert data into Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use upsert to avoid duplicate entries if run again
    const { error } = await supabase
      .from('crypto_price_history')
      .upsert(historyRows, { onConflict: 'symbol,timestamp' })

    if (error) {
      throw error
    }

    console.log(`Successfully inserted/updated ${historyRows.length} records for ${symbol}.`)

    return new Response(JSON.stringify({ success: true, records_added: historyRows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error populating price history:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})