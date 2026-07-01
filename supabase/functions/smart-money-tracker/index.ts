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

// Calculate confidence score using a WEIGHTED, PROPORTIONAL model (0-100).
// Value and wallet history are the dominant factors; heuristics are modifiers.
function calculateConfidenceScore(
  tx: TransactionWithDetails,
  ethPrice: number,
  walletPerformance?: WalletPerformance,
  walletHistoricalImpact?: number
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

  // --- Weighted, proportional scoring ---
  // Value component (0-1): log-scale, saturates near $10M
  // 50k -> ~0, 500k -> ~0.43, 5M -> ~0.86, 10M+ -> 1.0
  const valueNorm = tx.valueUSD > 0
    ? Math.min(1, Math.log10(tx.valueUSD / SIGNIFICANT_TX_THRESHOLD + 1) / Math.log10(10000000 / SIGNIFICANT_TX_THRESHOLD + 1))
    : 0;

  // Wallet history (0-1): prefer live perf, fallback to seeded historical_impact_score
  const impactScore = walletPerformance?.impact_score ?? walletHistoricalImpact ?? 0;
  const walletNorm = Math.max(0, Math.min(1, impactScore / 100));

  // Heuristic modifier (0-1): exchange direction + gas + success
  let modifierNorm = 0;
  let modifierCount = 0;
  if (tx.toExchange && !tx.fromExchange) { modifierNorm += 1.0; modifierCount++; }
  else if (tx.fromExchange && !tx.toExchange) { modifierNorm += 1.0; modifierCount++; }
  if (tx.gasPrice && tx.gasPrice > HIGH_GAS_THRESHOLD) { modifierNorm += 0.6; modifierCount++; }
  if (!tx.isError) { modifierNorm += 0.3; modifierCount++; }
  const modifierScore = modifierCount > 0 ? Math.min(1, modifierNorm / 2.0) : 0;

  // Weighted composite: 50% value, 35% wallet, 15% heuristics (proportional, not additive)
  const composite = (valueNorm * 0.50) + (walletNorm * 0.35) + (modifierScore * 0.15);
  const total = Math.round(composite * 100);

  // Keep breakdown for UI (proportional shares of the 100 points)
  heuristics.transactionSize = Math.round(valueNorm * 50);
  heuristics.historicalPattern = Math.round(walletNorm * 35);
  heuristics.gasPrice = (tx.gasPrice && tx.gasPrice > HIGH_GAS_THRESHOLD) ? Math.round(modifierScore * 6) : 0;
  heuristics.toExchange = (tx.toExchange && !tx.fromExchange) ? Math.round(modifierScore * 5) : 0;
  heuristics.fromExchange = (tx.fromExchange && !tx.toExchange) ? Math.round(modifierScore * 5) : 0;
  heuristics.successfulTx = !tx.isError ? Math.round(modifierScore * 2) : 0;

  heuristics.total = total;
  heuristics.isSmartMoney = total >= SMART_MONEY_CONFIDENCE_THRESHOLD;

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

// Fetch priority wallets with caching (default increased for wider coverage)
async function getPriorityWallets(limit: number = 100): Promise<SmartMoneyWallet[]> {
  const cacheKey = `smartmoney:wallets:v2:${limit}`;

  return await getOrFetch(cacheKey, async () => {
    const { data, error } = await supabase
      .from('smart_money_wallets')
      .select('*')
      .eq('is_active', true)
      .order('historical_impact_score', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }

    return data || [];
  }, CacheTTL.SMART_MONEY);
}

// Fetch transactions with enhanced details from Alchemy
async function fetchWalletTransactionsBatch(
  walletAddresses: string[],
  chain: string = 'ethereum'
): Promise<TransactionWithDetails[]> {
  const cacheKey = CacheKeys.walletTransactions(walletAddresses.slice(0, 5).join('_'));
  
  const cached = await getCache<TransactionWithDetails[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log('[Redis] Using cached wallet transactions with details');
    return cached;
  }

  const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
  if (!alchemyKey) {
    console.error('ALCHEMY_API_KEY not configured');
    return [];
  }

  const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  const allTransactions: TransactionWithDetails[] = [];
  const batchSize = 3;

  for (let i = 0; i < walletAddresses.length; i += batchSize) {
    const batch = walletAddresses.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (address) => {
      try {
        // Fetch outgoing transfers (FROM this wallet)
        const outgoingBody = {
          id: 1,
          jsonrpc: "2.0",
          method: "alchemy_getAssetTransfers",
          params: [{
            fromAddress: address,
            category: ["erc20", "external"],
            maxCount: "0x64", // 100
            order: "desc",
            withMetadata: true,
          }]
        };

        // Fetch incoming transfers (TO this wallet)
        const incomingBody = {
          id: 2,
          jsonrpc: "2.0",
          method: "alchemy_getAssetTransfers",
          params: [{
            toAddress: address,
            category: ["erc20", "external"],
            maxCount: "0x64", // 100
            order: "desc",
            withMetadata: true,
          }]
        };

        const [outRes, inRes] = await Promise.all([
          fetch(alchemyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outgoingBody),
          }),
          fetch(alchemyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incomingBody),
          }),
        ]);

        const outData = await outRes.json();
        const inData = await inRes.json();

        const transfers: TransactionWithDetails[] = [];

        const processTransfers = (result: any) => {
          if (!result?.result?.transfers) return;
          for (const tx of result.result.transfers) {
            const fromAddr = (tx.from || '').toLowerCase();
            const toAddr = (tx.to || '').toLowerCase();
            const value = tx.value || 0;
            const symbol = (tx.asset || 'ETH').toUpperCase();

            transfers.push({
              hash: tx.hash || '',
              from: fromAddr,
              to: toAddr,
              value: value,
              valueUSD: 0, // Will be calculated later with prices
              tokenSymbol: symbol,
              gasPrice: undefined, // Alchemy doesn't include gas in transfers
              gasUsed: undefined,
              isError: false, // Alchemy only returns successful transfers
              walletAddress: address.toLowerCase(),
              toExchange: KNOWN_EXCHANGE_ADDRESSES.has(toAddr),
              fromExchange: KNOWN_EXCHANGE_ADDRESSES.has(fromAddr),
            });
          }
        };

        processTransfers(outData);
        processTransfers(inData);

        return transfers;
      } catch (error) {
        console.error(`Error fetching Alchemy txs for ${address}:`, error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(txs => allTransactions.push(...txs));

    if (i + batchSize < walletAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`Alchemy fetched ${allTransactions.length} total transfers from ${walletAddresses.length} wallets`);

  // Cache for 5 minutes
  if (allTransactions.length > 0) {
    await setCache(cacheKey, allTransactions, CacheTTL.WALLET_TX);
  }
  return allTransactions;
}

// ========== BSC (BscScan / Etherscan V2 multi-chain) ==========
async function fetchBscWalletTransactionsBatch(
  walletAddresses: string[]
): Promise<TransactionWithDetails[]> {
  if (walletAddresses.length === 0) return [];
  const apiKey = Deno.env.get('ETHERSCAN_API_KEY');
  if (!apiKey) {
    console.warn('[BSC] ETHERSCAN_API_KEY not set, skipping BSC coverage');
    return [];
  }
  const cacheKey = `bsc:wallettx:${walletAddresses.slice(0, 5).join('_')}`;
  const cached = await getCache<TransactionWithDetails[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const all: TransactionWithDetails[] = [];
  // Etherscan V2 multichain: chainid=56 for BSC. Sequential to respect rate limits.
  for (const address of walletAddresses) {
    try {
      const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&address=${address}&page=1&offset=50&sort=desc&apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.status !== '1' || !Array.isArray(json.result)) continue;
      for (const tx of json.result) {
        const decimals = parseInt(tx.tokenDecimal || '18');
        const value = Number(tx.value) / Math.pow(10, decimals);
        const symbol = (tx.tokenSymbol || 'BNB').toUpperCase();
        const fromAddr = (tx.from || '').toLowerCase();
        const toAddr = (tx.to || '').toLowerCase();
        all.push({
          hash: tx.hash,
          from: fromAddr,
          to: toAddr,
          value,
          valueUSD: 0,
          tokenSymbol: symbol,
          gasPrice: tx.gasPrice ? Number(tx.gasPrice) / 1e9 : undefined,
          gasUsed: tx.gasUsed ? Number(tx.gasUsed) : undefined,
          isError: tx.isError === '1',
          walletAddress: address.toLowerCase(),
          toExchange: KNOWN_EXCHANGE_ADDRESSES.has(toAddr),
          fromExchange: KNOWN_EXCHANGE_ADDRESSES.has(fromAddr),
        });
      }
      await new Promise(r => setTimeout(r, 220));
    } catch (e) {
      console.error(`[BSC] fetch failed for ${address}:`, e);
    }
  }
  console.log(`[BSC] fetched ${all.length} txs from ${walletAddresses.length} wallets`);
  if (all.length > 0) await setCache(cacheKey, all, CacheTTL.WALLET_TX);
  return all;
}

// ========== SOLANA (Solscan public API) ==========
async function fetchSolanaWalletTransactionsBatch(
  walletAddresses: string[]
): Promise<TransactionWithDetails[]> {
  if (walletAddresses.length === 0) return [];
  const cacheKey = `sol:wallettx:${walletAddresses.slice(0, 5).join('_')}`;
  const cached = await getCache<TransactionWithDetails[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const solscanToken = Deno.env.get('SOLSCAN_API_KEY'); // optional (pro)
  const all: TransactionWithDetails[] = [];

  for (const address of walletAddresses) {
    try {
      const url = `https://public-api.solscan.io/account/splTransfers?account=${address}&limit=50`;
      const headers: Record<string, string> = { 'accept': 'application/json' };
      if (solscanToken) headers['token'] = solscanToken;
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      for (const t of items) {
        const decimals = t.decimals ?? 9;
        const raw = Number(t.changeAmount ?? t.amount ?? 0);
        const value = Math.abs(raw) / Math.pow(10, decimals);
        const symbol = (t.symbol || t.tokenSymbol || 'SOL').toUpperCase();
        const fromAddr = (t.owner || t.src || address).toLowerCase();
        const toAddr = (t.destination || t.dst || '').toLowerCase();
        all.push({
          hash: t.signature || t.txHash || '',
          from: fromAddr,
          to: toAddr,
          value,
          valueUSD: 0,
          tokenSymbol: symbol,
          gasPrice: undefined,
          gasUsed: undefined,
          isError: false,
          walletAddress: address.toLowerCase(),
          toExchange: KNOWN_EXCHANGE_ADDRESSES.has(toAddr),
          fromExchange: KNOWN_EXCHANGE_ADDRESSES.has(fromAddr),
        });
      }
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.error(`[SOL] fetch failed for ${address}:`, e);
    }
  }
  console.log(`[SOL] fetched ${all.length} transfers from ${walletAddresses.length} wallets`);
  if (all.length > 0) await setCache(cacheKey, all, CacheTTL.WALLET_TX);
  return all;
}


// Normalize token symbols for price lookup
const SYMBOL_MAP: Record<string, string> = {
  'WETH': 'ETH', 'WBTC': 'BTC', 'STETH': 'ETH', 'CBETH': 'ETH',
  'RETH': 'ETH', 'WSTETH': 'ETH', 'LIDO': 'LDO',
  'WMATIC': 'MATIC', 'WBNB': 'BNB', 'WAVAX': 'AVAX',
  'RENBTC': 'BTC', 'HBTC': 'BTC', 'SBTC': 'BTC',
  'AETHUSDC': 'USDC', 'AETHUSDT': 'USDT', 'ADAI': 'DAI',
  'AUSDC': 'USDC', 'AUSDT': 'USDT',
  'CUSDC': 'USDC', 'CDAI': 'DAI', 'CETH': 'ETH',
};

const STABLECOIN_SYMBOLS = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'PYUSD', 'FDUSD',
  'GUSD', 'LUSD', 'SUSD', 'MIM', 'CUSD', 'UST', 'EUSD',
]);

function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  return SYMBOL_MAP[upper] || upper;
}

// Fetch current prices from Binance
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const cacheKey = CacheKeys.cryptoPrices();
  
  const cached = await getCache<Record<string, number>>(cacheKey);
  if (cached && Object.keys(cached).length > 0) {
    console.log('[Redis] Using cached Binance prices');
    return cached;
  }

  try {
    // Normalize and deduplicate, exclude stablecoins
    const normalizedSymbols = [...new Set(
      symbols.map(normalizeSymbol).filter(s => !STABLECOIN_SYMBOLS.has(s) && s.length <= 10)
    )];
    
    if (!normalizedSymbols.includes('ETH')) normalizedSymbols.push('ETH');

    const prices: Record<string, number> = {};
    
    // Add stablecoin prices
    STABLECOIN_SYMBOLS.forEach(s => { prices[s] = 1; });

    // Fetch individual prices to avoid batch failure
    const pricePromises = normalizedSymbols.map(async (symbol) => {
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          prices[symbol] = parseFloat(data.price);
        }
      } catch {
        // Skip symbols without Binance pairs
      }
    });

    await Promise.all(pricePromises);

    // Map back wrapped tokens to their prices
    for (const [wrapped, base] of Object.entries(SYMBOL_MAP)) {
      if (prices[base] && !prices[wrapped]) {
        prices[wrapped] = prices[base];
      }
    }

    console.log(`Fetched prices for ${Object.keys(prices).length} symbols including mapped tokens`);
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
  walletPerformance: Map<string, WalletPerformance>,
  impactByAddr?: Map<string, number>
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
    const histImpact = impactByAddr?.get(tx.walletAddress);

    // Calculate confidence score (weighted, proportional)
    const confidence = calculateConfidenceScore(tx, ethPrice, walletPerf, histImpact);

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

    // Weighted-value accumulation of confidence factors (proportional, not additive-fixed)
    const w = Math.max(1, tx.valueUSD);
    flow.confidenceFactors.transactionSize += confidence.transactionSize * w;
    flow.confidenceFactors.gasPrice += confidence.gasPrice * w;
    flow.confidenceFactors.toExchange += confidence.toExchange * w;
    flow.confidenceFactors.fromExchange += confidence.fromExchange * w;
    flow.confidenceFactors.successfulTx += confidence.successfulTx * w;
    flow.confidenceFactors.historicalPattern += confidence.historicalPattern * w;
    // Track value-weighted confidence sum; final score = weighted mean (0-100)
    flow.confidenceScore += confidence.total * w;

    // Calculate inflow/outflow
    if (tx.toExchange && !tx.fromExchange) {
      flow.inflowUSD += tx.valueUSD;
      flow.netFlowUSD -= tx.valueUSD;
    } else if (tx.fromExchange && !tx.toExchange) {
      flow.outflowUSD += tx.valueUSD;
      flow.netFlowUSD += tx.valueUSD;
    }
  }

  // Calculate final metrics for each symbol
  for (const [symbol, flow] of flowsBySymbol) {
    const totalFlow = flow.inflowUSD + flow.outflowUSD;
    const symbolTxs = significantTxs.filter(t => t.tokenSymbol === symbol);
    const weightSum = symbolTxs.reduce((s, t) => s + Math.max(1, t.valueUSD), 0);

    // Value-weighted mean confidence (0-100)
    if (weightSum > 0) {
      flow.confidenceScore = Math.min(100, flow.confidenceScore / weightSum);
      flow.confidenceFactors.transactionSize = flow.confidenceFactors.transactionSize / weightSum;
      flow.confidenceFactors.gasPrice = flow.confidenceFactors.gasPrice / weightSum;
      flow.confidenceFactors.toExchange = flow.confidenceFactors.toExchange / weightSum;
      flow.confidenceFactors.fromExchange = flow.confidenceFactors.fromExchange / weightSum;
      flow.confidenceFactors.successfulTx = flow.confidenceFactors.successfulTx / weightSum;
      flow.confidenceFactors.historicalPattern = flow.confidenceFactors.historicalPattern / weightSum;
    }

    if (totalFlow > 0) {
      // Intensity scales with volume and confidence quality
      flow.intensity = Math.min(100, (totalFlow / 1000000) * 10 * (flow.confidenceScore / 50));

      const ratio = flow.netFlowUSD / totalFlow;
      if (ratio > 0.2) flow.dominantDirection = 'bullish';
      else if (ratio < -0.2) flow.dominantDirection = 'bearish';
      else flow.dominantDirection = 'neutral';
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
      console.log('Starting smart money flow update (weighted confidence, multi-chain)...');

      const wallets = await getPriorityWallets(100);
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

      // Group wallets by chain for correct fetcher routing
      const ethWallets = wallets.filter(w => !w.chain || w.chain === 'ethereum').map(w => w.wallet_address);
      const bscWallets = wallets.filter(w => w.chain === 'bsc' || w.chain === 'bnb').map(w => w.wallet_address);
      const solWallets = wallets.filter(w => w.chain === 'solana').map(w => w.wallet_address);
      const allAddresses = wallets.map(w => w.wallet_address);

      // Historical impact lookup (used to weight confidence when live perf missing)
      const impactByAddr = new Map<string, number>();
      wallets.forEach(w => impactByAddr.set(w.wallet_address.toLowerCase(), w.historical_impact_score || 0));

      // Fetch wallet performance data
      const walletPerformance = await getWalletPerformance(allAddresses);
      console.log(`Loaded performance data for ${walletPerformance.size} wallets`);

      // Fetch transactions across all chains in parallel
      const [ethTxs, bscTxs, solTxs] = await Promise.all([
        ethWallets.length ? fetchWalletTransactionsBatch(ethWallets) : Promise.resolve([]),
        bscWallets.length ? fetchBscWalletTransactionsBatch(bscWallets) : Promise.resolve([]),
        solWallets.length ? fetchSolanaWalletTransactionsBatch(solWallets) : Promise.resolve([]),
      ]);
      const transactions = [...ethTxs, ...bscTxs, ...solTxs];
      console.log(`Fetched ${transactions.length} txs (ETH=${ethTxs.length} BSC=${bscTxs.length} SOL=${solTxs.length})`);

      // Get prices
      const uniqueSymbols = [...new Set(
        transactions
          .map(tx => tx.tokenSymbol?.toUpperCase())
          .filter(Boolean)
      )].slice(0, 50);
      const prices = await getCurrentPrices(uniqueSymbols);
      console.log(`Got prices for ${Object.keys(prices).length} symbols`);

      // Process flows with confidence scoring
      const flows = await processTransactionsToFlows(
        transactions,
        exchangeAddresses,
        prices,
        walletPerformance,
        impactByAddr
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

    // ===== SEED_WALLETS =====
    if (action === 'seed_wallets') {
      const newWallets = [
        { wallet_address: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', label: 'Alameda Research', wallet_type: 'fund', priority: 8, historical_impact_score: 75 },
        { wallet_address: '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2', label: 'Paradigm', wallet_type: 'fund', priority: 9, historical_impact_score: 80 },
        { wallet_address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', label: 'Compound Treasury', wallet_type: 'institution', priority: 7, historical_impact_score: 65 },
        { wallet_address: '0xbeefbabeea323f07c59926295205d3b7a17e8638', label: 'Wintermute', wallet_type: 'institution', priority: 8, historical_impact_score: 70 },
        { wallet_address: '0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0', label: 'Jump Trading', wallet_type: 'institution', priority: 9, historical_impact_score: 82 },
        { wallet_address: '0x0548f59fee79f8832c299e01dca5c76f034f558e', label: 'Galaxy Digital', wallet_type: 'fund', priority: 8, historical_impact_score: 72 },
        { wallet_address: '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621', label: 'DWF Labs', wallet_type: 'institution', priority: 8, historical_impact_score: 70 },
        { wallet_address: '0x4862733b5fddfd35f35ea8ccf08f5045e57388b3', label: 'Grayscale', wallet_type: 'institution', priority: 9, historical_impact_score: 85 },
        { wallet_address: '0x176f3dab24a159341c0509bb36b833e7fdd0a132', label: 'Whale 0x176f', wallet_type: 'whale', priority: 7, historical_impact_score: 60 },
        { wallet_address: '0xb29380ffc20696729b7ab8d093fa1e2ec14dfe2b', label: 'Whale 0xb293', wallet_type: 'whale', priority: 7, historical_impact_score: 58 },
        { wallet_address: '0x8103683202aa8da10536036edef04cdd865c225e', label: 'Whale 0x8103', wallet_type: 'whale', priority: 7, historical_impact_score: 62 },
        { wallet_address: '0xe8e8f41ed29e46f34e206d7d2a7d6f735a3ff2cb', label: 'Celsius Wallet', wallet_type: 'institution', priority: 6, historical_impact_score: 55 },
        { wallet_address: '0xa7efae728d2936e78bda97dc267687568dd593f3', label: 'Three Arrows Capital', wallet_type: 'fund', priority: 7, historical_impact_score: 60 },
      ];

      const { data, error: insertError } = await supabase
        .from('smart_money_wallets')
        .upsert(
          newWallets.map(w => ({ ...w, chain: 'ethereum', is_active: true })),
          { onConflict: 'wallet_address' }
        )
        .select('label');

      if (insertError) {
        return new Response(JSON.stringify({ success: false, error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        inserted: data?.length || 0,
        wallets: data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use: get_flows, update_flows, get_wallets, get_confidence_breakdown, seed_wallets',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in smart-money-tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
