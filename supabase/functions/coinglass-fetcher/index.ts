import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

interface CoinGlassBalance {
  exchange_name: string;
  total_balance: number;
  balance_change_percent_1d: number;
}

async function fetchCoinGlassData(symbol: string) {
  try {
    const response = await fetch(`https://api.coinglass.com/api/exchange/balance/list?symbol=${symbol.toUpperCase()}`);
    if (!response.ok) {
      throw new Error(`CoinGlass API error: ${response.status}`);
    }
    const result = await response.json();
    if (result.code !== "0" || !result.data) {
      throw new Error(`CoinGlass API error: ${result.msg || 'No data found'}`);
    }
    return result.data;
  } catch (error) {
    console.error(`Error fetching CoinGlass data for ${symbol}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: CoinGlassBalance[] = await fetchCoinGlassData(symbol);

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, message: `Failed to fetch data for ${symbol}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Calculate net flow based on balance changes
    const totalNetFlow = data.reduce((acc, exchange) => {
      const dailyChange = (exchange.balance_change_percent_1d / 100) * exchange.total_balance;
      return acc + (isNaN(dailyChange) ? 0 : dailyChange);
    }, 0);
    
    // A positive net flow (increase in exchange balance) is bearish, negative is bullish
    const netFlowValue = totalNetFlow * -1; // Invert for inflow/outflow logic

    const { error } = await supabase
      .from('crypto_onchain_metrics')
      .upsert({
        symbol: symbol.toUpperCase(),
        exchange_net_flow: netFlowValue, // Custom column for this data
        timestamp: new Date().toISOString()
      }, { onConflict: 'symbol,timestamp' });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, symbol, netFlow: netFlowValue }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in coinglass-fetcher:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
