import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== CACHE EM MEMÓRIA COM TTL ==========
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache global para transações e preços
const txCache = new MemoryCache<any[]>(600); // 10 min TTL
const priceCache = new MemoryCache<Record<string, number>>(60); // 1 min TTL

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

// Threshold mínimo em USD para considerar uma transação significativa
const SIGNIFICANT_TX_THRESHOLD = 50000; // $50k+

// EMA smoothing factor (0.1 = suave, 0.5 = responsivo)
const EMA_ALPHA = 0.2;

// ========== FUNÇÕES AUXILIARES ==========

// Calcula EMA para suavizar ruído
function calculateEMA(currentValue: number, previousEMA: number, alpha: number = EMA_ALPHA): number {
  return alpha * currentValue + (1 - alpha) * previousEMA;
}

// Busca carteiras prioritárias ordenadas por impacto
async function getPriorityWallets(limit: number = 20): Promise<SmartMoneyWallet[]> {
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
}

// Busca transações de múltiplas carteiras em batch (otimizado)
async function fetchWalletTransactionsBatch(
  walletAddresses: string[],
  chain: string = 'ethereum'
): Promise<any[]> {
  const cacheKey = `txs_${chain}_${walletAddresses.slice(0, 5).join('_')}`;
  const cached = txCache.get(cacheKey);
  if (cached) {
    console.log('Using cached transactions');
    return cached;
  }

  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  if (!etherscanKey) {
    console.error('ETHERSCAN_API_KEY not configured');
    return [];
  }

  // Buscar transações de até 5 carteiras em paralelo (rate limit friendly)
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

    // Rate limit: esperar 200ms entre batches
    if (i + batchSize < walletAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  txCache.set(cacheKey, allTransactions, 600);
  return allTransactions;
}

// Busca preços atuais da Binance (cacheado)
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const cacheKey = 'binance_prices';
  const cached = priceCache.get(cacheKey);
  if (cached) {
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

    priceCache.set(cacheKey, prices, 60);
    return prices;
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return {};
  }
}

// Processa transações e calcula fluxos agregados por símbolo
async function processTransactionsToFlows(
  transactions: any[],
  exchangeAddresses: Set<string>,
  prices: Record<string, number>
): Promise<Map<string, FlowData>> {
  const flowsBySymbol = new Map<string, FlowData>();

  // Filtrar transações significativas (>threshold)
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

    // Determinar direção: inflow para exchange = bearish, outflow = bullish
    const toExchange = exchangeAddresses.has(tx.to?.toLowerCase());
    const fromExchange = exchangeAddresses.has(tx.from?.toLowerCase());

    if (toExchange && !fromExchange) {
      // Inflow para exchange = bearish (venda)
      flow.inflowUSD += valueUSD;
      flow.netFlowUSD -= valueUSD;
    } else if (fromExchange && !toExchange) {
      // Outflow de exchange = bullish (compra/hodl)
      flow.outflowUSD += valueUSD;
      flow.netFlowUSD += valueUSD;
    }
  }

  // Calcular direção dominante e intensidade
  for (const [symbol, flow] of flowsBySymbol) {
    const totalFlow = flow.inflowUSD + flow.outflowUSD;
    
    if (totalFlow > 0) {
      // Intensidade de 0-100
      flow.intensity = Math.min(100, (totalFlow / 1000000) * 10); // Escala: $100M = 100%
      
      // Direção dominante
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

// Atualiza o cache de fluxos no banco
async function updateFlowCache(
  flows: Map<string, FlowData>,
  timeframe: string = '1h'
): Promise<void> {
  const updates = [];

  for (const [symbol, flow] of flows) {
    // Buscar EMA anterior para suavização
    const { data: existing } = await supabase
      .from('smart_money_flow_cache')
      .select('ema_flow')
      .eq('token_symbol', symbol)
      .eq('timeframe', timeframe)
      .maybeSingle();

    const previousEMA = existing?.ema_flow || 0;
    const newEMA = calculateEMA(flow.netFlowUSD, previousEMA);

    updates.push({
      token_symbol: symbol,
      timeframe,
      net_flow_usd: flow.netFlowUSD,
      total_inflow_usd: flow.inflowUSD,
      total_outflow_usd: flow.outflowUSD,
      whale_tx_count: 0, // TODO: implementar contagem
      dominant_direction: flow.dominantDirection,
      flow_intensity: flow.intensity,
      ema_flow: newEMA,
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from('smart_money_flow_cache')
      .upsert(updates, { onConflict: 'token_symbol,timeframe' });

    if (error) {
      console.error('Error updating flow cache:', error);
    } else {
      console.log(`Updated ${updates.length} flow cache entries`);
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

    // ===== AÇÃO: GET_FLOWS - Busca fluxos do cache =====
    if (action === 'get_flows') {
      const symbolList = symbols || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      
      const { data: flows, error } = await supabase
        .from('smart_money_flow_cache')
        .select('*')
        .in('token_symbol', symbolList.map((s: string) => s.toUpperCase()))
        .eq('timeframe', timeframe)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        data: flows || [],
        cached: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== AÇÃO: UPDATE_FLOWS - Atualiza fluxos do on-chain =====
    if (action === 'update_flows') {
      console.log('Starting smart money flow update...');

      // 1. Buscar carteiras prioritárias
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

      // 2. Separar endereços de exchanges
      const exchangeAddresses = new Set(
        wallets
          .filter(w => w.wallet_type === 'exchange')
          .map(w => w.wallet_address.toLowerCase())
      );

      // 3. Buscar transações em batch
      const allAddresses = wallets.map(w => w.wallet_address);
      const transactions = await fetchWalletTransactionsBatch(allAddresses);
      console.log(`Fetched ${transactions.length} transactions`);

      // 4. Buscar preços atuais
      const uniqueSymbols = [...new Set(
        transactions
          .map(tx => tx.tokenSymbol?.toUpperCase())
          .filter(Boolean)
      )].slice(0, 20);
      const prices = await getCurrentPrices(uniqueSymbols);
      console.log(`Got prices for ${Object.keys(prices).length} symbols`);

      // 5. Processar fluxos
      const flows = await processTransactionsToFlows(transactions, exchangeAddresses, prices);
      console.log(`Calculated flows for ${flows.size} symbols`);

      // 6. Atualizar cache
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

    // ===== AÇÃO: GET_WALLETS - Lista carteiras monitoradas =====
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