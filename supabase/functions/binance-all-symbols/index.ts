import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbolInfo[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching all Binance symbols...');

    // Get all symbols from Binance
    const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!exchangeInfoResponse.ok) {
      throw new Error(`Binance API error: ${exchangeInfoResponse.status}`);
    }

    const exchangeInfo: BinanceExchangeInfo = await exchangeInfoResponse.json();
    
    // Filter for active USDT trading pairs
    const usdtSymbols = exchangeInfo.symbols
      .filter(symbol => 
        symbol.quoteAsset === 'USDT' && 
        symbol.status === 'TRADING' && 
        symbol.isSpotTradingAllowed
      )
      .map(symbol => ({
        binance_symbol: symbol.symbol,
        base_asset: symbol.baseAsset,
        status: symbol.status,
        is_trading_allowed: symbol.isSpotTradingAllowed
      }));

    console.log(`Found ${usdtSymbols.length} active USDT trading pairs`);

    // Get current 24hr ticker data for all symbols
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error(`Binance ticker API error: ${tickerResponse.status}`);
    }

    const tickerData = await tickerResponse.json();
    const tickerMap = new Map(tickerData.map((t: any) => [t.symbol, t]));

    // Enhance symbol data with ticker information
    const enhancedSymbols = usdtSymbols.map(symbol => {
      const ticker = tickerMap.get(symbol.binance_symbol);
      return {
        ...symbol,
        quote_volume_24h: ticker ? parseFloat(ticker.quoteVolume) : 0,
        price_change_percent_24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
        last_price: ticker ? parseFloat(ticker.lastPrice) : 0,
        updated_at: new Date().toISOString()
      };
    });

    // Sort by volume and take all symbols (no artificial limit)
    const sortedSymbols = enhancedSymbols
      .sort((a, b) => b.quote_volume_24h - a.quote_volume_24h);

    console.log(`Processing ${sortedSymbols.length} symbols for database insertion`);

    // Create or update binance_symbols table data
    const { error: insertError } = await supabase
      .from('binance_symbols')
      .upsert(sortedSymbols, { 
        onConflict: 'binance_symbol',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting Binance symbols:', insertError);
      throw insertError;
    }

    // Also populate cryptocurrencies table with new tokens found
    const cryptoEntries = sortedSymbols
      .filter(symbol => symbol.quote_volume_24h > 10000) // Only tokens with some volume
      .map(symbol => ({
        id: symbol.base_asset.toLowerCase(),
        symbol: symbol.base_asset,
        name: symbol.base_asset, // We'll use symbol as name for now
        current_price: symbol.last_price,
        market_cap: 0, // Will be updated by other functions
        market_cap_rank: 999999,
        total_volume: symbol.quote_volume_24h,
        price_change_percentage_24h: symbol.price_change_percent_24h,
        volume_24h: symbol.quote_volume_24h,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

    if (cryptoEntries.length > 0) {
      const { error: cryptoError } = await supabase
        .from('cryptocurrencies')
        .upsert(cryptoEntries, { 
          onConflict: 'id',
          ignoreDuplicates: true // Don't overwrite existing CoinGecko data
        });

      if (cryptoError) {
        console.error('Error updating cryptocurrencies:', cryptoError);
      } else {
        console.log(`Updated ${cryptoEntries.length} cryptocurrency entries`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        totalSymbols: sortedSymbols.length,
        newCryptoEntries: cryptoEntries.length,
        topSymbols: sortedSymbols.slice(0, 10).map(s => ({ 
          symbol: s.binance_symbol, 
          volume: s.quote_volume_24h 
        })),
        message: `Successfully processed ${sortedSymbols.length} Binance symbols`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in Binance symbols fetcher:', error);
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