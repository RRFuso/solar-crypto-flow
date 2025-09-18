import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const coingeckoApiKey = Deno.env.get('COINGECKO_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cryptocurrency data population...');

    // Build the URL for 500 cryptocurrencies
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '250'); // CoinGecko API limit per request
    url.searchParams.set('sparkline', 'false');
    url.searchParams.set('price_change_percentage', '24h,7d,30d');
    url.searchParams.set('x_cg_demo_api_key', coingeckoApiKey);

    const allCryptos: CoinGeckoMarketData[] = [];

    // Fetch in batches to get 2000+ cryptocurrencies
    for (let page = 1; page <= 8; page++) {
      url.searchParams.set('page', page.toString());
      
      console.log(`Fetching page ${page} from CoinGecko...`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const pageData: CoinGeckoMarketData[] = await response.json();
      allCryptos.push(...pageData);
      
      console.log(`Fetched ${pageData.length} cryptocurrencies from page ${page}`);
      
      // Rate limiting - wait 1 second between requests
      if (page < 8) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Total cryptocurrencies fetched: ${allCryptos.length}`);

    // Prepare data for Supabase
    const cryptosToInsert = allCryptos.map(crypto => ({
      id: crypto.id,
      symbol: crypto.symbol.toUpperCase(),
      name: crypto.name,
      current_price: crypto.current_price || 0,
      market_cap: crypto.market_cap || 0,
      market_cap_rank: crypto.market_cap_rank || 999999,
      total_volume: crypto.total_volume || 0,
      high_24h: crypto.high_24h || 0,
      low_24h: crypto.low_24h || 0,
      price_change_24h: crypto.price_change_24h || 0,
      price_change_percentage_24h: crypto.price_change_percentage_24h || 0,
      market_cap_change_24h: crypto.market_cap_change_24h || 0,
      market_cap_change_percentage_24h: crypto.market_cap_change_percentage_24h || 0,
      circulating_supply: crypto.circulating_supply || 0,
      total_supply: crypto.total_supply,
      ath: crypto.ath || 0,
      ath_change_percentage: crypto.ath_change_percentage || 0,
      ath_date: crypto.ath_date ? new Date(crypto.ath_date).toISOString() : null,
      atl: crypto.atl || 0,
      atl_change_percentage: crypto.atl_change_percentage || 0,
      atl_date: crypto.atl_date ? new Date(crypto.atl_date).toISOString() : null,
      last_updated: crypto.last_updated ? new Date(crypto.last_updated).toISOString() : new Date().toISOString(),
      volume_24h: crypto.total_volume || 0,
      created_at: new Date().toISOString()
    }));

    // Insert data in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < cryptosToInsert.length; i += batchSize) {
      const batch = cryptosToInsert.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);
      
      const { error } = await supabase
        .from('cryptocurrencies')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }

      totalInserted += batch.length;
      console.log(`Successfully inserted batch. Total so far: ${totalInserted}`);
    }

    console.log(`Successfully populated ${totalInserted} cryptocurrencies`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalPopulated: totalInserted,
        message: `Successfully populated ${totalInserted} cryptocurrencies in the database`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error populating cryptocurrencies:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});