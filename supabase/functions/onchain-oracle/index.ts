import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { getCache, setCache, getOrFetch, CacheKeys, CacheTTL } from '../_shared/redis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const DUNE_QUERIES = {
  ETH_WHALE_FLOWS: '3445128',
  ERC20_WHALE_FLOWS: '3445129',
  EXCHANGE_FLOWS: '3445130',
};

async function fetchDuneData(queryId: string, parameters: any[] = []): Promise<any> {
  const cacheKey = `dune:${queryId}:${JSON.stringify(parameters)}`;
  
  // Try Redis cache first
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    console.log(`[Redis] Using cached Dune data for query ${queryId}`);
    return cached;
  }

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

    // Cache Dune data for 15 minutes
    await setCache(cacheKey, data, CacheTTL.ONCHAIN);
    return data;
  } catch (error) {
    console.error('Error fetching Dune data:', error);
    throw error;
  }
}

async function fetchAlchemyData(contractAddress: string, chain: string = 'ethereum'): Promise<any> {
  const cacheKey = `alchemy:${contractAddress}:${chain}`;
  
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    console.log(`[Redis] Using cached Alchemy data for ${contractAddress}`);
    return cached;
  }

  const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
  if (!alchemyKey) {
    throw new Error('ALCHEMY_API_KEY not configured');
  }

  try {
    const { data, error } = await supabase.functions.invoke('secure-api-proxy', {
      body: {
        endpoint: 'alchemy',
        chain,
        rpcRequest: {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x0',
            toBlock: 'latest',
            category: ['erc20'],
            withMetadata: true,
            maxCount: '0x64', // 100
            order: 'desc',
            contractAddresses: [contractAddress]
          }]
        }
      }
    });

    if (error) {
      console.error('Alchemy fetch error:', error);
      throw new Error(`Alchemy API error: ${error.message}`);
    }

    // Cache for 5 minutes
    await setCache(cacheKey, data, CacheTTL.WALLET_TX);
    return data;
  } catch (error) {
    console.error('Error fetching Alchemy data:', error);
    throw error;
  }
}

async function fetchCoinGeckoData(symbols: string[]): Promise<any> {
  const cacheKey = `coingecko:markets:${symbols.sort().join(',')}`;
  
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    console.log(`[Redis] Using cached CoinGecko data`);
    return cached;
  }

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

    // Cache for 5 minutes
    await setCache(cacheKey, data, CacheTTL.MARKET_DATA);
    return data;
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
    throw error;
  }
}

async function calculateWhaleMetrics(transactions: any[], symbol: string): Promise<Partial<OnChainMetrics>> {
  const WHALE_THRESHOLD = 1000000;
  let whaleTransactionCount = 0;
  let whaleVolumeUSD = 0;
  let exchangeInflow = 0;
  let exchangeOutflow = 0;

  const exchangeAddresses = new Set([
    '0x28c6c06298d514db089934071355e5743bf21d60',
    '0x267a5240229152364691a751755323ac272a575f',
    '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
    '0x46340b20830761efd32832a74d7169b29feb9758',
  ]);

  for (const tx of transactions) {
    const valueUSD = parseFloat(tx.value) * parseFloat(tx.tokenPrice || '0');
    
    if (valueUSD >= WHALE_THRESHOLD) {
      whaleTransactionCount++;
      whaleVolumeUSD += valueUSD;
    }

    if (exchangeAddresses.has(tx.to.toLowerCase())) {
      exchangeInflow += valueUSD;
    } else if (exchangeAddresses.has(tx.from.toLowerCase())) {
      exchangeOutflow += valueUSD;
    }
  }

  const netFlow = exchangeOutflow - exchangeInflow;
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
  // Check Redis cache first
  const cacheKey = CacheKeys.onChainData(symbol);
  const cached = await getCache<OnChainMetrics>(cacheKey);
  if (cached) {
    console.log(`[Redis] Using cached on-chain metrics for ${symbol}`);
    return cached;
  }

  console.log(`Processing on-chain data for ${symbol}`);

  try {
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

    if (contractData?.contract_address) {
      try {
        const alchemyData = await fetchAlchemyData(contractData.contract_address, contractData.chain || 'ethereum');
        const whaleMetrics = await calculateWhaleMetrics(alchemyData?.result?.transfers || [], symbol);
        metrics = { ...metrics, ...whaleMetrics };
      } catch (error) {
        console.error(`Error processing Alchemy data for ${symbol}:`, error);
      }
    }

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

    // Store in DB
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

    // Cache in Redis for 15 minutes
    await setCache(cacheKey, metrics, CacheTTL.ONCHAIN);

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
      const symbolsList = symbols || ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC'];
      const results: OnChainMetrics[] = [];

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

  } catch (error: unknown) {
    console.error('Error in onchain-oracle:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});