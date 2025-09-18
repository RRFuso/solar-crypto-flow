import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Top cryptocurrencies to populate
const TOP_CRYPTOS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
  'SOLUSDT', 'DOGEUSDT', 'TRXUSDT', 'LINKUSDT', 'AVAXUSDT',
  'DOTUSDT', 'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT',
  'FILUSDT', 'VETUSDT', 'ETCUSDT', 'XLMUSDT', 'ALGOUSDT'
]

async function fetchPriceHistoryForSymbol(symbol: string): Promise<any[]> {
  try {
    console.log(`Fetching 90 days of history for ${symbol}...`)
    
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=90`
    const response = await fetch(binanceUrl)
    
    if (!response.ok) {
      throw new Error(`Binance API error for ${symbol}: ${response.status}`)
    }
    
    const klines: BinanceKline[] = await response.json()
    
    return klines.map(kline => ({
      symbol: symbol.replace('USDT', ''),
      timestamp: new Date(kline[0]).toISOString(),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }))
    
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return []
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting bulk price history population...')
    
    const allHistoryData = []
    
    // Fetch data for all symbols with rate limiting
    for (let i = 0; i < TOP_CRYPTOS.length; i++) {
      const symbol = TOP_CRYPTOS[i]
      
      try {
        const historyData = await fetchPriceHistoryForSymbol(symbol)
        allHistoryData.push(...historyData)
        
        // Rate limiting - wait 100ms between requests
        if (i < TOP_CRYPTOS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (error) {
        console.error(`Failed to process ${symbol}:`, error)
      }
    }

    console.log(`Collected ${allHistoryData.length} total price history records`)

    if (allHistoryData.length > 0) {
      // Insert data in batches to avoid overwhelming the database
      const BATCH_SIZE = 500
      let totalInserted = 0
      
      for (let i = 0; i < allHistoryData.length; i += BATCH_SIZE) {
        const batch = allHistoryData.slice(i, i + BATCH_SIZE)
        
        const { error } = await supabase
          .from('crypto_price_history')
          .upsert(batch, { onConflict: 'symbol,timestamp' })

        if (error) {
          console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error)
        } else {
          totalInserted += batch.length
          console.log(`Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(allHistoryData.length / BATCH_SIZE)} (${batch.length} records)`)
        }
      }

      console.log(`Successfully inserted/updated ${totalInserted} price history records`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      symbols_processed: TOP_CRYPTOS.length,
      records_inserted: allHistoryData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in bulk price history population:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})