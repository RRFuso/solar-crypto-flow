import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OnChainMetrics {
  symbol: string;
  netFlow: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  whaleTransactionCount: number;
  whaleVolumeUSD: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  lastUpdated: string;
}

interface DuneWhaleData {
  symbol: string;
  transaction_count: number;
  total_volume_usd: number;
  net_flow: number;
  exchange_inflow: number;
  exchange_outflow: number;
}

// Dune Analytics queries for whale tracking
const DUNE_QUERIES = {
  ETH_WHALE_FLOWS: '3445128', // Ethereum whale movements
  ERC20_WHALE_FLOWS: '3445129', // ERC-20 whale movements 
  EXCHANGE_FLOWS: '3445130', // Exchange flow analysis
};

async function fetchDuneData(queryId: string, parameters: any[] = []): Promise<any> {
  const duneKey = Deno.env.get('DUNE_API_KEY');
  if (!duneKey) {
    throw new Error('DUNE_API_KEY not configured');
  }

  try {
    const { data, error } = await supabase.functions.invoke('dune-fetch', {
      body: { queryId, parameters }
    });

    if (error) {
      console.error('Dune fetch error:', error);
      throw new Error(`Dune API error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching Dune data:', error);
    throw error;
  }
}

async function fetchEtherscanData(contractAddress: string, chainId: number = 1): Promise<any> {
  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  if (!etherscanKey) {
    throw new Error('ETHERSCAN_API_KEY not configured');
  }

  try {
    const { data, error } = await supabase.functions.invoke('secure-api-proxy', {
      body: {
        endpoint: 'etherscan',
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: contractAddress,
          page: 1,
          offset: 100,
          sort: 'desc',
          chainid: chainId
        }
      }
    });

    if (error) {
      console.error('Etherscan fetch error:', error);
      throw new Error(`Etherscan API error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching Etherscan data:', error);
    throw error;
  }
}

async function fetchCoinGeckoData(symbols: string[]): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('secure-coingecko-proxy', {
      body: {
        endpoint: '/coins/markets',
        params: {
          vs_currency: 'usd',
          ids: symbols.join(','),
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '1h,24h,7d,30d'
        }
      }
    });

    if (error) {
      console.error('CoinGecko fetch error:', error);
      throw new Error(`CoinGecko API error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
    throw error;
  }
}

async function calculateWhaleMetrics(transactions: any[], symbol: string): Promise<Partial<OnChainMetrics>> {
  const WHALE_THRESHOLD = 1000000; // $1M+ transactions
  let whaleTransactionCount = 0;
  let whaleVolumeUSD = 0;
  let exchangeInflow = 0;
  let exchangeOutflow = 0;

  // Known exchange addresses (simplified list)
  const exchangeAddresses = new Set([
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
    '0x267a5240229152364691a751755323ac272a575f', // Kraken
    '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKEx
    '0x46340b20830761efd32832a74d7169b29feb9758', // Huobi
  ]);

  for (const tx of transactions) {
    const valueUSD = parseFloat(tx.value) * parseFloat(tx.tokenPrice || '0');
    
    if (valueUSD >= WHALE_THRESHOLD) {
      whaleTransactionCount++;
      whaleVolumeUSD += valueUSD;
    }

    // Calculate exchange flows
    if (exchangeAddresses.has(tx.to.toLowerCase())) {
      exchangeInflow += valueUSD;
    } else if (exchangeAddresses.has(tx.from.toLowerCase())) {
      exchangeOutflow += valueUSD;
    }
  }

  const netFlow = exchangeOutflow - exchangeInflow; // Positive = net outflow (bullish)
  let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

  if (netFlow > 1000000 && whaleVolumeUSD > 5000000) {
    sentiment = 'Bullish';
  } else if (netFlow < -1000000 || whaleVolumeUSD < 1000000) {
    sentiment = 'Bearish';
  }

  return {
    netFlow,
    exchangeInflow,
    exchangeOutflow,
    whaleTransactionCount,
    whaleVolumeUSD,
    sentiment
  };
}

async function processSymbolData(symbol: string): Promise<OnChainMetrics> {
  console.log(`Processing on-chain data for ${symbol}`);

  try {
    // Get contract address for the symbol
    const { data: contractData } = await supabase
      .from('token_contracts')
      .select('contract_address, chain')
      .eq('symbol', symbol.toUpperCase())
      .single();

    let metrics: OnChainMetrics = {
      symbol: symbol.toUpperCase(),
      netFlow: 0,
      exchangeInflow: 0,
      exchangeOutflow: 0,
      whaleTransactionCount: 0,
      whaleVolumeUSD: 0,
      sentiment: 'Neutral',
      lastUpdated: new Date().toISOString()
    };

    // If we have contract data, fetch Etherscan data
    if (contractData?.contract_address) {
      try {
        const etherscanData = await fetchEtherscanData(contractData.contract_address);
        const whaleMetrics = await calculateWhaleMetrics(etherscanData.result || [], symbol);
        metrics = { ...metrics, ...whaleMetrics };
      } catch (error) {
        console.error(`Error processing Etherscan data for ${symbol}:`, error);
      }
    }

    // Supplement with Dune Analytics data for major tokens
    if (['BTC', 'ETH', 'USDT', 'USDC', 'BNB'].includes(symbol.toUpperCase())) {
      try {
        const duneData = await fetchDuneData(DUNE_QUERIES.ERC20_WHALE_FLOWS, [
          { name: 'token_symbol', value: symbol.toUpperCase() }
        ]);
        
        if (duneData?.result?.rows?.length > 0) {
          const duneMetrics = duneData.result.rows[0] as DuneWhaleData;
          metrics.whaleTransactionCount += duneMetrics.transaction_count || 0;
          metrics.whaleVolumeUSD += duneMetrics.total_volume_usd || 0;
          metrics.netFlow = duneMetrics.net_flow || metrics.netFlow;
        }
      } catch (error) {
        console.error(`Error processing Dune data for ${symbol}:`, error);
      }
    }

    // Store metrics in database
    const { error: upsertError } = await supabase
      .from('crypto_price_action_signals')
      .upsert({
        symbol: metrics.symbol,
        smart_money_sentiment: metrics.sentiment.toLowerCase(),
        whale_activity: metrics.whaleTransactionCount,
        last_updated: metrics.lastUpdated
      });

    if (upsertError) {
      console.error('Error storing metrics:', upsertError);
    }

    return metrics;

  } catch (error) {
    console.error(`Error processing ${symbol}:`, error);
    return {
      symbol: symbol.toUpperCase(),
      netFlow: 0,
      exchangeInflow: 0,
      exchangeOutflow: 0,
      whaleTransactionCount: 0,
      whaleVolumeUSD: 0,
      sentiment: 'Neutral',
      lastUpdated: new Date().toISOString()
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, action } = await req.json();

    if (action === 'batch_update') {
      // Process multiple symbols for batch updates
      const symbolsList = symbols || ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC'];
      const results: OnChainMetrics[] = [];

      // Process in chunks to avoid timeout
      const chunkSize = 5;
      for (let i = 0; i < symbolsList.length; i += chunkSize) {
        const chunk = symbolsList.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(processSymbolData);
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Failed to process ${chunk[index]}:`, result.reason);
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        data: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Single symbol processing
    if (symbols && symbols.length > 0) {
      const symbol = symbols[0];
      const metrics = await processSymbolData(symbol);
      
      return new Response(JSON.stringify({
        success: true,
        data: metrics
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'No symbols provided'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in onchain-oracle:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});