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

// ========== TYPES ==========
interface SmartMoneyWallet {
  id: string;
  wallet_address: string;
  label: string;
  wallet_type: string;
  chain: string;
  priority: number;
  historical_impact_score?: number;
}

interface WalletPerformance {
  wallet_address: string;
  impact_score: number;
  profit_ratio: number;
}

interface TransactionWithDetails {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  tokenSymbol: string;
  gasPrice?: number;
  gasUsed?: number;
  isError?: boolean;
  walletAddress: string;
  toExchange: boolean;
  fromExchange: boolean;
}

interface ConfidenceHeuristics {
  transactionSize: number;      // +25 for >10 ETH, +15 for >1 ETH
  gasPrice: number;             // +15 for >50 Gwei
  toExchange: number;           // +20 for transfer TO exchange
  fromExchange: number;         // +20 for transfer FROM exchange
  successfulTx: number;         // +5 for successful transaction
  historicalPattern: number;    // +15 for high impact wallet
  total: number;                // Sum of all
  isSmartMoney: boolean;        // true if total >= 40
}

interface FlowData {
  symbol: string;
  netFlowUSD: number;
  inflowUSD: number;
  outflowUSD: number;
  dominantDirection: 'bullish' | 'bearish' | 'neutral';
  intensity: number;
  emaFlow: number;
  confidenceScore: number;
  confidenceFactors: Record<string, number>;
  whaleTxCount: number;
  whaleTxValue: number;
  avgGasPriceGwei: number;
  successfulTxCount: number;
}

// ========== CONFIGURATION ==========
const SIGNIFICANT_TX_THRESHOLD = 50000;  // $50k minimum
const WHALE_TX_THRESHOLD = 1000000;       // $1M+ is whale
const EMA_ALPHA = 0.2;
const ETH_WHALE_THRESHOLD = 10;           // 10 ETH
const ETH_SIGNIFICANT_THRESHOLD = 1;      // 1 ETH
const HIGH_GAS_THRESHOLD = 50;            // 50 Gwei
const WALLET_IMPACT_THRESHOLD = 50;       // Impact score threshold
const SMART_MONEY_CONFIDENCE_THRESHOLD = 40; // Minimum score to be smart money

// Known exchange addresses
const KNOWN_EXCHANGE_ADDRESSES = new Set([
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', // Binance
  '0x5041ed759dd4afc3a72b8192c143f72f4724081a', // Coinbase
  '0x3cd751e6b0078be393132286c442345e5dc49699', // Coinbase
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase
  '0x8e5ea40bd54f8cab9b2cd779e12a75fce43f21e7', // Kraken
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken
  '0x2b5634c42055806a59e9107ed44d43c426e58258', // Kucoin
  '0xd6216fc19db775df9774a6e33526131da7d19a2c', // Kucoin
  '0xab5c66752a9e8167967685f1450532fb96d5d24f', // Huobi
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKX
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128', // OKX
  '0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23', // Gate.io
].map(a => a.toLowerCase()));

// ========== HELPER FUNCTIONS ==========
function calculateEMA(currentValue: number, previousEMA: number, alpha: number = EMA_ALPHA): number {
  return alpha * currentValue + (1 - alpha) * previousEMA;
}

// Calculate confidence score for a transaction using 6 heuristics
function calculateConfidenceScore(
  tx: TransactionWithDetails,
  ethPrice: number,
  walletPerformance?: WalletPerformance
): ConfidenceHeuristics {
  const heuristics: ConfidenceHeuristics = {
    transactionSize: 0,
    gasPrice: 0,
    toExchange: 0,
    fromExchange: 0,
    successfulTx: 0,
    historicalPattern: 0,
    total: 0,
    isSmartMoney: false,
  };

  // 1. Transaction Size: +25 for >10 ETH, +15 for >1 ETH
  const valueInETH = ethPrice > 0 ? tx.valueUSD / ethPrice : 0;
  if (valueInETH > ETH_WHALE_THRESHOLD) {
    heuristics.transactionSize = 25;
  } else if (valueInETH > ETH_SIGNIFICANT_THRESHOLD) {
    heuristics.transactionSize = 15;
  }

  // 2. Gas Price: +15 for >50 Gwei
  if (tx.gasPrice && tx.gasPrice > HIGH_GAS_THRESHOLD) {
    heuristics.gasPrice = 15;
  }

  // 3. Transfer TO Exchange: +20 (indicates selling)
  if (tx.toExchange && !tx.fromExchange) {
    heuristics.toExchange = 20;
  }

  // 4. Transfer FROM Exchange: +20 (indicates buying)
  if (tx.fromExchange && !tx.toExchange) {
    heuristics.fromExchange = 20;
  }

  // 5. Successful Transaction: +5
  if (!tx.isError) {
    heuristics.successfulTx = 5;
  }

  // 6. Historical Pattern: +15 for high-impact wallet
  if (walletPerformance && walletPerformance.impact_score >= WALLET_IMPACT_THRESHOLD) {
    heuristics.historicalPattern = 15;
  }

  // Calculate total
  heuristics.total = 
    heuristics.transactionSize +
    heuristics.gasPrice +
    heuristics.toExchange +
    heuristics.fromExchange +
    heuristics.successfulTx +
    heuristics.historicalPattern;

  // Determine if it qualifies as smart money signal
  heuristics.isSmartMoney = heuristics.total >= SMART_MONEY_CONFIDENCE_THRESHOLD;

  return heuristics;
}

// ========== DATA FETCHING FUNCTIONS ==========

// Get wallet performance data
async function getWalletPerformance(walletAddresses: string[]): Promise<Map<string, WalletPerformance>> {
  const cacheKey = `walletperf:${walletAddresses.slice(0, 5).join('_')}`;
  
  const cached = await getCache<WalletPerformance[]>(cacheKey);
  if (cached) {
    const map = new Map<string, WalletPerformance>();
    cached.forEach(p => map.set(p.wallet_address.toLowerCase(), p));
    return map;
  }

  const { data, error } = await supabase
    .from('smart_money_wallet_performance')
    .select('wallet_address, impact_score, profit_ratio')
    .in('wallet_address', walletAddresses);

  if (error) {
    console.error('Error fetching wallet performance:', error);
    return new Map();
  }

  const map = new Map<string, WalletPerformance>();
  if (data) {
    data.forEach(p => map.set(p.wallet_address.toLowerCase(), p));
    await setCache(cacheKey, data, CacheTTL.SMART_MONEY);
  }

  return map;
}

// Fetch priority wallets with caching
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

// Fetch transactions with enhanced details from Etherscan
async function fetchWalletTransactionsBatch(
  walletAddresses: string[],
  chain: string = 'ethereum'
): Promise<TransactionWithDetails[]> {
  const cacheKey = CacheKeys.walletTransactions(walletAddresses.slice(0, 5).join('_'));
  
  const cached = await getCache<TransactionWithDetails[]>(cacheKey);
  if (cached) {
    console.log('[Redis] Using cached wallet transactions with details');
    return cached;
  }

  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  if (!etherscanKey) {
    console.error('ETHERSCAN_API_KEY not configured');
    return [];
  }

  const batchSize = 3;
  const allTransactions: TransactionWithDetails[] = [];

  for (let i = 0; i < walletAddresses.length; i += batchSize) {
    const batch = walletAddresses.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (address) => {
      try {
        // Fetch token transactions
        const tokenUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=50&sort=desc&apikey=${etherscanKey}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        // Also fetch normal ETH transactions for gas price info
        const txUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=50&sort=desc&apikey=${etherscanKey}`;
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();

        // Create a map of tx hash to gas price
        const gasPriceMap = new Map<string, { gasPrice: number; gasUsed: number; isError: boolean }>();
        if (txData.status === '1' && txData.result) {
          txData.result.forEach((tx: any) => {
            gasPriceMap.set(tx.hash.toLowerCase(), {
              gasPrice: parseFloat(tx.gasPrice) / 1e9, // Convert to Gwei
              gasUsed: parseInt(tx.gasUsed),
              isError: tx.isError === '1',
            });
          });
        }

        if (tokenData.status === '1' && tokenData.result) {
          return tokenData.result.map((tx: any) => {
            const toAddress = tx.to?.toLowerCase() || '';
            const fromAddress = tx.from?.toLowerCase() || '';
            const gasInfo = gasPriceMap.get(tx.hash?.toLowerCase());

            return {
              hash: tx.hash,
              from: fromAddress,
              to: toAddress,
              value: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18')),
              valueUSD: 0, // Will be calculated later
              tokenSymbol: tx.tokenSymbol?.toUpperCase() || 'ETH',
              gasPrice: gasInfo?.gasPrice,
              gasUsed: gasInfo?.gasUsed,
              isError: gasInfo?.isError || false,
              walletAddress: address.toLowerCase(),
              toExchange: KNOWN_EXCHANGE_ADDRESSES.has(toAddress),
              fromExchange: KNOWN_EXCHANGE_ADDRESSES.has(fromAddress),
            } as TransactionWithDetails;
          });
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

  // Cache for 5 minutes
  await setCache(cacheKey, allTransactions, CacheTTL.WALLET_TX);
  return allTransactions;
}

// Fetch current prices from Binance
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const cacheKey = CacheKeys.cryptoPrices();
  
  const cached = await getCache<Record<string, number>>(cacheKey);
  if (cached) {
    console.log('[Redis] Using cached Binance prices');
    return cached;
  }

  try {
    const binanceSymbols = [...new Set([...symbols, 'ETH'])].map(s => `${s.toUpperCase()}USDT`);
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

    await setCache(cacheKey, prices, CacheTTL.PRICE_REALTIME);
    return prices;
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return {};
  }
}

// ========== MAIN PROCESSING FUNCTION ==========
async function processTransactionsToFlows(
  transactions: TransactionWithDetails[],
  exchangeAddresses: Set<string>,
  prices: Record<string, number>,
  walletPerformance: Map<string, WalletPerformance>
): Promise<Map<string, FlowData>> {
  const flowsBySymbol = new Map<string, FlowData>();
  const ethPrice = prices['ETH'] || 2000;

  // Update transaction values with USD prices
  const enrichedTransactions = transactions.map(tx => ({
    ...tx,
    valueUSD: tx.value * (prices[tx.tokenSymbol] || 0),
    toExchange: tx.toExchange || exchangeAddresses.has(tx.to?.toLowerCase()),
    fromExchange: tx.fromExchange || exchangeAddresses.has(tx.from?.toLowerCase()),
  }));

  // Filter significant transactions
  const significantTxs = enrichedTransactions.filter(tx => tx.valueUSD >= SIGNIFICANT_TX_THRESHOLD);

  console.log(`Processing ${significantTxs.length} significant txs out of ${transactions.length} total`);

  // Process each significant transaction
  for (const tx of significantTxs) {
    const symbol = tx.tokenSymbol;
    const walletPerf = walletPerformance.get(tx.walletAddress);
    
    // Calculate confidence score using 6 heuristics
    const confidence = calculateConfidenceScore(tx, ethPrice, walletPerf);

    // Only process if it's a smart money signal
    if (!confidence.isSmartMoney) continue;

    if (!flowsBySymbol.has(symbol)) {
      flowsBySymbol.set(symbol, {
        symbol,
        netFlowUSD: 0,
        inflowUSD: 0,
        outflowUSD: 0,
        dominantDirection: 'neutral',
        intensity: 0,
        emaFlow: 0,
        confidenceScore: 0,
        confidenceFactors: {
          transactionSize: 0,
          gasPrice: 0,
          toExchange: 0,
          fromExchange: 0,
          successfulTx: 0,
          historicalPattern: 0,
        },
        whaleTxCount: 0,
        whaleTxValue: 0,
        avgGasPriceGwei: 0,
        successfulTxCount: 0,
      });
    }

    const flow = flowsBySymbol.get(symbol)!;

    // Track whale transactions
    if (tx.valueUSD >= WHALE_TX_THRESHOLD) {
      flow.whaleTxCount++;
      flow.whaleTxValue += tx.valueUSD;
    }

    // Track gas prices
    if (tx.gasPrice) {
      flow.avgGasPriceGwei = (flow.avgGasPriceGwei + tx.gasPrice) / 2;
    }

    // Track successful transactions
    if (!tx.isError) {
      flow.successfulTxCount++;
    }

    // Accumulate confidence factors
    flow.confidenceFactors.transactionSize += confidence.transactionSize;
    flow.confidenceFactors.gasPrice += confidence.gasPrice;
    flow.confidenceFactors.toExchange += confidence.toExchange;
    flow.confidenceFactors.fromExchange += confidence.fromExchange;
    flow.confidenceFactors.successfulTx += confidence.successfulTx;
    flow.confidenceFactors.historicalPattern += confidence.historicalPattern;
    flow.confidenceScore += confidence.total;

    // Calculate inflow/outflow
    if (tx.toExchange && !tx.fromExchange) {
      // Money going TO exchange = potential selling = bearish for price
      flow.inflowUSD += tx.valueUSD;
      flow.netFlowUSD -= tx.valueUSD;
    } else if (tx.fromExchange && !tx.toExchange) {
      // Money coming FROM exchange = accumulation = bullish for price
      flow.outflowUSD += tx.valueUSD;
      flow.netFlowUSD += tx.valueUSD;
    }
  }

  // Calculate final metrics for each symbol
  for (const [symbol, flow] of flowsBySymbol) {
    const totalFlow = flow.inflowUSD + flow.outflowUSD;
    
    if (totalFlow > 0) {
      // Intensity weighted by confidence score
      const avgConfidence = flow.confidenceScore / Math.max(1, significantTxs.filter(t => t.tokenSymbol === symbol).length);
      flow.intensity = Math.min(100, (totalFlow / 1000000) * 10 * (avgConfidence / 40));
      
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

// Update flow cache in Redis and Supabase
async function updateFlowCache(
  flows: Map<string, FlowData>,
  timeframe: string = '1h'
): Promise<void> {
  const updates = [];

  for (const [symbol, flow] of flows) {
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
      whale_tx_count: flow.whaleTxCount,
      dominant_direction: flow.dominantDirection,
      flow_intensity: flow.intensity,
      ema_flow: newEMA,
      confidence_score: flow.confidenceScore,
      confidence_factors: flow.confidenceFactors,
      whale_transactions_value: flow.whaleTxValue,
      avg_gas_price_gwei: flow.avgGasPriceGwei,
      successful_tx_count: flow.successfulTxCount,
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    await setCache(cacheKey, flowData, CacheTTL.SMART_MONEY);
    updates.push(flowData);
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from('smart_money_flow_cache')
      .upsert(updates, { onConflict: 'token_symbol,timeframe' });

    if (error) {
      console.error('Error updating DB flow cache:', error);
    } else {
      console.log(`Updated ${updates.length} flow cache entries with confidence scores (Redis + DB)`);
    }
  }
}

// Update wallet performance based on transaction outcomes
async function updateWalletPerformance(
  transactions: TransactionWithDetails[],
  prices: Record<string, number>
): Promise<void> {
  const walletStats = new Map<string, {
    address: string;
    totalTx: number;
    profitableTx: number;
    totalVolume: number;
  }>();

  // Group transactions by wallet
  for (const tx of transactions) {
    const addr = tx.walletAddress;
    if (!walletStats.has(addr)) {
      walletStats.set(addr, {
        address: addr,
        totalTx: 0,
        profitableTx: 0,
        totalVolume: 0,
      });
    }

    const stats = walletStats.get(addr)!;
    stats.totalTx++;
    stats.totalVolume += tx.valueUSD;

    // Simple heuristic: successful tx from exchange = potentially profitable
    if (!tx.isError && tx.fromExchange) {
      stats.profitableTx++;
    }
  }

  // Update database
  for (const [addr, stats] of walletStats) {
    const profitRatio = stats.totalTx > 0 ? stats.profitableTx / stats.totalTx : 0;
    const impactScore = Math.min(100, profitRatio * 50 + (Math.log10(stats.totalVolume + 1) * 10));

    await supabase
      .from('smart_money_wallet_performance')
      .upsert({
        wallet_address: addr,
        total_transactions: stats.totalTx,
        profitable_transactions: stats.profitableTx,
        profit_ratio: profitRatio,
        total_volume_usd: stats.totalVolume,
        impact_score: impactScore,
        last_calculated_at: new Date().toISOString(),
      }, { onConflict: 'wallet_address' });
  }

  console.log(`Updated performance metrics for ${walletStats.size} wallets`);
}

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, timeframe = '1h' } = await req.json();

    // ===== GET_FLOWS =====
    if (action === 'get_flows') {
      const symbolList = symbols || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      
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
      console.log('Starting smart money flow update with 6 heuristics...');

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

      // Get exchange addresses from wallets
      const exchangeAddresses = new Set(
        wallets
          .filter(w => w.wallet_type === 'exchange')
          .map(w => w.wallet_address.toLowerCase())
      );

      // Merge with known exchanges
      KNOWN_EXCHANGE_ADDRESSES.forEach(addr => exchangeAddresses.add(addr));

      const allAddresses = wallets.map(w => w.wallet_address);
      
      // Fetch wallet performance data
      const walletPerformance = await getWalletPerformance(allAddresses);
      console.log(`Loaded performance data for ${walletPerformance.size} wallets`);

      // Fetch transactions with enhanced details
      const transactions = await fetchWalletTransactionsBatch(allAddresses);
      console.log(`Fetched ${transactions.length} transactions with gas details`);

      // Get prices
      const uniqueSymbols = [...new Set(
        transactions
          .map(tx => tx.tokenSymbol?.toUpperCase())
          .filter(Boolean)
      )].slice(0, 20);
      const prices = await getCurrentPrices(uniqueSymbols);
      console.log(`Got prices for ${Object.keys(prices).length} symbols`);

      // Process flows with confidence scoring
      const flows = await processTransactionsToFlows(
        transactions,
        exchangeAddresses,
        prices,
        walletPerformance
      );
      console.log(`Calculated flows for ${flows.size} symbols with confidence scores`);

      // Update flow cache
      await updateFlowCache(flows, timeframe);

      // Update wallet performance metrics
      await updateWalletPerformance(transactions, prices);

      return new Response(JSON.stringify({
        success: true,
        processed: {
          wallets: wallets.length,
          transactions: transactions.length,
          symbols: flows.size,
          heuristics: ['transactionSize', 'gasPrice', 'toExchange', 'fromExchange', 'successfulTx', 'historicalPattern'],
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

    // ===== GET_CONFIDENCE_BREAKDOWN =====
    if (action === 'get_confidence_breakdown') {
      const symbolList = symbols || ['BTC', 'ETH', 'SOL'];
      
      const { data } = await supabase
        .from('smart_money_flow_cache')
        .select('token_symbol, confidence_score, confidence_factors, whale_tx_count, avg_gas_price_gwei')
        .in('token_symbol', symbolList.map((s: string) => s.toUpperCase()))
        .eq('timeframe', timeframe);

      return new Response(JSON.stringify({
        success: true,
        data: data || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use: get_flows, update_flows, get_wallets, get_confidence_breakdown',
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
