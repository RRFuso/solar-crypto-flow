import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting AI Watchlist signals population...')

    // 1. Fetch top crypto signals with high explosive potential
    const { data: signals, error: signalsError } = await supabase
      .from('crypto_price_action_signals')
      .select('*')
      .in('explosive_potential', ['High', 'Medium'])
      .order('last_updated', { ascending: false })
      .limit(20)

    if (signalsError) {
      throw signalsError
    }

    console.log(`Found ${signals?.length || 0} signals with high/medium explosive potential`)

    // 2. Process each signal and create watchlist entries
    const watchlistEntries = []

    for (const signal of signals || []) {
      try {
        // Calculate upside potential based on signal data
        let upsidePotential = 0
        let reason = ''

        if (signal.explosive_potential === 'High') {
          upsidePotential = 0
          reason = `High explosive potential detected. Strong volume and price action indicators suggest significant upside momentum.`
        } else if (signal.explosive_potential === 'Medium') {
          upsidePotential = 0
          reason = `Medium explosive potential with positive price action signals. Moderate upside potential identified.`
        }

        // Add additional analysis based on other signal factors
        if (signal.is_breakout) {
          upsidePotential += 10
          reason += ` Breakout pattern confirmed.`
        }

        if (signal.is_accelerating) {
          upsidePotential += 5
          reason += ` Accelerating momentum detected.`
        }

        if (signal.whale_activity && signal.whale_activity > 5) {
          upsidePotential += 8
          reason += ` Significant whale activity observed.`
        }

        watchlistEntries.push({
          symbol: signal.symbol,
          reason: reason.trim(),
          upside_potential: null, // não validado: sem modelo de potencial com avaliação fora da amostra
          created_at: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Error processing signal for ${signal.symbol}:`, error)
      }
    }

    // 3. Insert watchlist entries into ai_watchlist table
    if (watchlistEntries.length > 0) {
      console.log(`Inserting ${watchlistEntries.length} watchlist entries...`)
      
      // Delete existing entries first
      await supabase.from('ai_watchlist').delete().neq('id', 0)
      
      const { error: insertError } = await supabase
        .from('ai_watchlist')
        .insert(watchlistEntries)

      if (insertError) {
        throw insertError
      }

      console.log('AI Watchlist signals populated successfully!')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      entries_created: watchlistEntries.length,
      watchlist: watchlistEntries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    console.error('Error populating AI watchlist signals:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})