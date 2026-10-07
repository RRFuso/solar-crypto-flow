import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveCaller, isInternalOrAdmin, deny } from "../_shared/auth.ts";
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    { const caller = await resolveCaller(req); if (!isInternalOrAdmin(caller)) return deny(caller, corsHeaders); }
    console.log('[BATCH-CACHE-LOGOS] Starting batch logo caching job...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch top 100 cryptocurrencies by market cap
    const { data: coingeckoData, error: coingeckoError } = await supabase.functions.invoke(
      'secure-coingecko-proxy',
      {
        body: {
          endpoint: '/coins/markets',
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false
          }
        }
      }
    )

    if (coingeckoError) {
      console.error('[BATCH-CACHE-LOGOS] Error fetching top cryptos:', coingeckoError)
      throw new Error('Failed to fetch top cryptocurrencies')
    }

    const cryptos = coingeckoData as Array<{ symbol: string; name: string; market_cap_rank: number }>
    console.log(`[BATCH-CACHE-LOGOS] Found ${cryptos.length} cryptocurrencies to cache`)

    // Start background caching task
    const backgroundTask = async () => {
      let cached = 0
      let failed = 0

      for (const crypto of cryptos) {
        try {
          // Check if already cached
          const { data: existing } = await supabase
            .from('cached_crypto_logos')
            .select('symbol')
            .eq('symbol', crypto.symbol.toUpperCase())
            .single()

          if (existing) {
            console.log(`[BATCH-CACHE-LOGOS] Logo already cached for ${crypto.symbol}`)
            cached++
            continue
          }

          // Cache the logo
          const { error: cacheError } = await supabase.functions.invoke(
            'cache-crypto-logo',
            {
              body: { symbol: crypto.symbol.toUpperCase() }
            }
          )

          if (cacheError) {
            console.error(`[BATCH-CACHE-LOGOS] Failed to cache logo for ${crypto.symbol}:`, cacheError)
            failed++
          } else {
            console.log(`[BATCH-CACHE-LOGOS] Successfully cached logo for ${crypto.symbol}`)
            cached++
          }

          // Rate limiting - wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`[BATCH-CACHE-LOGOS] Error processing ${crypto.symbol}:`, error)
          failed++
        }
      }

      console.log(`[BATCH-CACHE-LOGOS] Batch caching complete. Cached: ${cached}, Failed: ${failed}`)
    }

    // Start background task - run synchronously since EdgeRuntime may not be available
    // We'll run it in the background without waiting
    backgroundTask().catch(err => console.error('[BATCH-CACHE-LOGOS] Background task error:', err));

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Started caching logos for ${cryptos.length} cryptocurrencies`,
        count: cryptos.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error: unknown) {
    console.error('[BATCH-CACHE-LOGOS] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})
