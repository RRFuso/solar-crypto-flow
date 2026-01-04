import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { getCache, setCache, getOrFetch, CacheKeys, CacheTTL, mgetCache } from '../_shared/redis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== CONFIGURAÇÃO ==========
interface SmartMoneyWallet {
  id: string;
  wallet_address: string;
  label: string;
  wallet_type: string;
  chain: string;
  priority: number;
}

interface FlowData {
  symbol: string;
  netFlowUSD: number;
  inflowUSD: number;
  outflowUSD: number;
  dominantDirection: 'bullish' | 'bearish' | 'neutral';
  intensity: number;
  emaFlow: number;
}

const SIGNIFICANT_TX_THRESHOLD = 50000;
const EMA_ALPHA = 0.2;

// ========== FUNÇÕES COM REDIS CACHE ==========

function calculateEMA(currentValue: number, previousEMA: number, alpha: number = EMA_ALPHA): number {
  return alpha * currentValue + (1 - alpha) * previousEMA;
}

// Busca carteiras prioritárias (cached in Redis)
async function getPriorityWallets(limit: number = 20): Promise<SmartMoneyWallet[]> {
  const cacheKey = `smartmoney:wallets:${limit}`;
  
  return await getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase
      .from('smart_money_wallets')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('historical_impact_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }

    return data || [];
  }, CacheTTL.SMART_MONEY);
}

// Busca transações com cache Redis
async function fetchWalletTransactionsBatch(
  walletAddresses: string[],
  chain: string = 'ethereum'
): Promise<any[]> {
  const cacheKey = CacheKeys.walletTransactions(walletAddresses.slice(0, 5).join('_'));
  
  const cached = await getCache<any[]>(cacheKey);
  if (cached) {
    console.log('[Redis] Using cached wallet transactions');
    return cached;
  }

  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  if (!etherscanKey) {
    console.error('ETHERSCAN_API_KEY not configured');
    return [];
  }

  const batchSize = 3;
  const allTransactions: any[] = [];

  for (let i = 0; i < walletAddresses.length; i += batchSize) {
    const batch = walletAddresses.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (address) => {
      try {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=50&sort=desc&apikey=${etherscanKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          return data.result.map((tx: any) => ({
            ...tx,
            walletAddress: address,
          }));
        }
        return [];
      } catch (error) {
        console.error(`Error fetching txs for ${address}:`, error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(txs => allTransactions.push(...txs));

    if (i + batchSize < walletAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Cache in Redis for 5 minutes
  await setCache(cacheKey, allTransactions, CacheTTL.WALLET_TX);
  return allTransactions;
}

// Busca preços com cache Redis
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const cacheKey = CacheKeys.cryptoPrices();
  
  const cached = await getCache<Record<string, number>>(cacheKey);
  if (cached) {
    console.log('[Redis] Using cached Binance prices');
    return cached;
  }

  try {
    const binanceSymbols = symbols.map(s => `${s.toUpperCase()}USDT`);
    const url = `https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(binanceSymbols)}`;
    const response = await fetch(url);
    const data = await response.json();

    const prices: Record<string, number> = {};
    if (Array.isArray(data)) {
      data.forEach((item: { symbol: string; price: string }) => {
        const symbol = item.symbol.replace('USDT', '');
        prices[symbol] = parseFloat(item.price);
      });
    }

    // Cache for 30 seconds (real-time prices)
    await setCache(cacheKey, prices, CacheTTL.PRICE_REALTIME);
    return prices;
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return {};
  }
}

// Processa transações e calcula fluxos
async function processTransactionsToFlows(
  transactions: any[],
  exchangeAddresses: Set<string>,
  prices: Record<string, number>
): Promise<Map<string, FlowData>> {
  const flowsBySymbol = new Map<string, FlowData>();

  const significantTxs = transactions.filter(tx => {
    const symbol = tx.tokenSymbol?.toUpperCase() || 'ETH';
    const price = prices[symbol] || 0;
    const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));
    const valueUSD = value * price;
    return valueUSD >= SIGNIFICANT_TX_THRESHOLD;
  });

  console.log(`Processing ${significantTxs.length} significant txs out of ${transactions.length} total`);

  for (const tx of significantTxs) {
    const symbol = tx.tokenSymbol?.toUpperCase() || 'ETH';
    const price = prices[symbol] || 0;
    const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));
    const valueUSD = value * price;

    if (!flowsBySymbol.has(symbol)) {
      flowsBySymbol.set(symbol, {
        symbol,
        netFlowUSD: 0,
        inflowUSD: 0,
        outflowUSD: 0,
        dominantDirection: 'neutral',
        intensity: 0,
        emaFlow: 0,
      });
    }

    const flow = flowsBySymbol.get(symbol)!;

    const toExchange = exchangeAddresses.has(tx.to?.toLowerCase());
    const fromExchange = exchangeAddresses.has(tx.from?.toLowerCase());

    if (toExchange && !fromExchange) {
      flow.inflowUSD += valueUSD;
      flow.netFlowUSD -= valueUSD;
    } else if (fromExchange && !toExchange) {
      flow.outflowUSD += valueUSD;
      flow.netFlowUSD += valueUSD;
    }
  }

  for (const [symbol, flow] of flowsBySymbol) {
    const totalFlow = flow.inflowUSD + flow.outflowUSD;
    
    if (totalFlow > 0) {
      flow.intensity = Math.min(100, (totalFlow / 1000000) * 10);
      
      const ratio = flow.netFlowUSD / totalFlow;
      if (ratio > 0.2) {
        flow.dominantDirection = 'bullish';
      } else if (ratio < -0.2) {
        flow.dominantDirection = 'bearish';
      } else {
        flow.dominantDirection = 'neutral';
      }
    }
  }

  return flowsBySymbol;
}

// Atualiza cache de fluxos (Redis + DB)
async function updateFlowCache(
  flows: Map<string, FlowData>,
  timeframe: string = '1h'
): Promise<void> {
  const updates = [];

  for (const [symbol, flow] of flows) {
    // Get previous EMA from Redis first
    const cacheKey = CacheKeys.smartMoneyFlow(symbol, timeframe);
    const cachedFlow = await getCache<{ ema_flow: number }>(cacheKey);
    const previousEMA = cachedFlow?.ema_flow || 0;
    const newEMA = calculateEMA(flow.netFlowUSD, previousEMA);

    const flowData = {
      token_symbol: symbol,
      timeframe,
      net_flow_usd: flow.netFlowUSD,
      total_inflow_usd: flow.inflowUSD,
      total_outflow_usd: flow.outflowUSD,
      whale_tx_count: 0,
      dominant_direction: flow.dominantDirection,
      flow_intensity: flow.intensity,
      ema_flow: newEMA,
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    // Cache in Redis
    await setCache(cacheKey, flowData, CacheTTL.SMART_MONEY);
    updates.push(flowData);
  }

  // Also persist to DB
  if (updates.length > 0) {
    const { error } = await supabase
      .from('smart_money_flow_cache')
      .upsert(updates, { onConflict: 'token_symbol,timeframe' });

    if (error) {
      console.error('Error updating DB flow cache:', error);
    } else {
      console.log(`Updated ${updates.length} flow cache entries (Redis + DB)`);
    }
  }
}

// ========== HANDLER PRINCIPAL ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, timeframe = '1h' } = await req.json();

    // ===== GET_FLOWS - Redis first, then DB =====
    if (action === 'get_flows') {
      const symbolList = symbols || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      
      // Try Redis first for all symbols
      const cacheKeys = symbolList.map((s: string) => CacheKeys.smartMoneyFlow(s.toUpperCase(), timeframe));
      const cachedFlows = await mgetCache<any>(cacheKeys);
      
      const results: any[] = [];
      const missedSymbols: string[] = [];
      
      symbolList.forEach((symbol: string, index: number) => {
        const cached = cachedFlows.get(cacheKeys[index]);
        if (cached) {
          results.push(cached);
        } else {
          missedSymbols.push(symbol.toUpperCase());
        }
      });

      // Fetch missed from DB
      if (missedSymbols.length > 0) {
        const { data: dbFlows } = await supabase
          .from('smart_money_flow_cache')
          .select('*')
          .in('token_symbol', missedSymbols)
          .eq('timeframe', timeframe)
          .gt('expires_at', new Date().toISOString());

        if (dbFlows) {
          for (const flow of dbFlows) {
            results.push(flow);
            // Cache in Redis for next time
            await setCache(CacheKeys.smartMoneyFlow(flow.token_symbol, timeframe), flow, CacheTTL.SMART_MONEY);
          }
        }
      }

      console.log(`[Redis] ${cachedFlows.size} hits, ${missedSymbols.length} misses from DB`);

      return new Response(JSON.stringify({
        success: true,
        data: results,
        cached: cachedFlows.size > 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== UPDATE_FLOWS =====
    if (action === 'update_flows') {
      console.log('Starting smart money flow update...');

      const wallets = await getPriorityWallets(15);
      console.log(`Found ${wallets.length} priority wallets`);

      if (wallets.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No wallets configured',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const exchangeAddresses = new Set(
        wallets
          .filter(w => w.wallet_type === 'exchange')
          .map(w => w.wallet_address.toLowerCase())
      );

      const allAddresses = wallets.map(w => w.wallet_address);
      const transactions = await fetchWalletTransactionsBatch(allAddresses);
      console.log(`Fetched ${transactions.length} transactions`);

      const uniqueSymbols = [...new Set(
        transactions
          .map(tx => tx.tokenSymbol?.toUpperCase())
          .filter(Boolean)
      )].slice(0, 20);
      const prices = await getCurrentPrices(uniqueSymbols);
      console.log(`Got prices for ${Object.keys(prices).length} symbols`);

      const flows = await processTransactionsToFlows(transactions, exchangeAddresses, prices);
      console.log(`Calculated flows for ${flows.size} symbols`);

      await updateFlowCache(flows, timeframe);

      return new Response(JSON.stringify({
        success: true,
        processed: {
          wallets: wallets.length,
          transactions: transactions.length,
          symbols: flows.size,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== GET_WALLETS =====
    if (action === 'get_wallets') {
      const wallets = await getPriorityWallets(50);
      
      return new Response(JSON.stringify({
        success: true,
        data: wallets,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use: get_flows, update_flows, get_wallets',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-money-tracker:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});