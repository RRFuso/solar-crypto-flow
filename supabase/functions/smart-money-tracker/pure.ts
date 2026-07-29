// Pure (side-effect-free) logic extracted from index.ts so it can be
// integration-tested without booting the HTTP server or Redis/Supabase clients.

export interface TransactionWithDetails {
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

export interface WalletPerformance {
  wallet_address: string;
  impact_score: number;
  profit_ratio: number;
}

export interface ConfidenceHeuristics {
  transactionSize: number;
  gasPrice: number;
  toExchange: number;
  fromExchange: number;
  successfulTx: number;
  historicalPattern: number;
  total: number;
  isSmartMoney: boolean;
}

export interface FlowData {
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

export const SIGNIFICANT_TX_THRESHOLD = 50000;
export const WHALE_TX_THRESHOLD = 1000000;
export const HIGH_GAS_THRESHOLD = 50;
export const SMART_MONEY_CONFIDENCE_THRESHOLD = 40;

export function calculateConfidenceScore(
  tx: TransactionWithDetails,
  _ethPrice: number,
  walletPerformance?: WalletPerformance,
  walletHistoricalImpact?: number,
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

  const valueNorm = tx.valueUSD > 0
    ? Math.min(
        1,
        Math.log10(tx.valueUSD / SIGNIFICANT_TX_THRESHOLD + 1) /
          Math.log10(10000000 / SIGNIFICANT_TX_THRESHOLD + 1),
      )
    : 0;

  const impactScore = walletPerformance?.impact_score ?? walletHistoricalImpact ?? 0;
  const walletNorm = Math.max(0, Math.min(1, impactScore / 100));

  let modifierNorm = 0;
  let modifierCount = 0;
  if (tx.toExchange && !tx.fromExchange) { modifierNorm += 1.0; modifierCount++; }
  else if (tx.fromExchange && !tx.toExchange) { modifierNorm += 1.0; modifierCount++; }
  if (tx.gasPrice && tx.gasPrice > HIGH_GAS_THRESHOLD) { modifierNorm += 0.6; modifierCount++; }
  if (!tx.isError) { modifierNorm += 0.3; modifierCount++; }
  const modifierScore = modifierCount > 0 ? Math.min(1, modifierNorm / 2.0) : 0;

  const composite = (valueNorm * 0.50) + (walletNorm * 0.35) + (modifierScore * 0.15);
  const total = Math.round(composite * 100);

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

export async function processTransactionsToFlows(
  transactions: TransactionWithDetails[],
  exchangeAddresses: Set<string>,
  prices: Record<string, number>,
  walletPerformance: Map<string, WalletPerformance>,
  impactByAddr?: Map<string, number>,
): Promise<Map<string, FlowData>> {
  const flowsBySymbol = new Map<string, FlowData>();
  // Sum of the weights that actually contributed to confidenceScore.
  // Must NOT include transactions that were skipped (isSmartMoney === false),
  // otherwise the weighted mean is diluted toward zero.
  const weightBySymbol = new Map<string, number>();
  const ethPrice = prices['ETH'] || 2000;


  const enrichedTransactions = transactions.map((tx) => ({
    ...tx,
    valueUSD: tx.value * (prices[tx.tokenSymbol] || 0),
    toExchange: tx.toExchange || exchangeAddresses.has(tx.to?.toLowerCase()),
    fromExchange: tx.fromExchange || exchangeAddresses.has(tx.from?.toLowerCase()),
  }));

  const significantTxs = enrichedTransactions.filter(
    (tx) => tx.valueUSD >= SIGNIFICANT_TX_THRESHOLD,
  );

  for (const tx of significantTxs) {
    const symbol = tx.tokenSymbol;
    const walletPerf = walletPerformance.get(tx.walletAddress);
    const histImpact = impactByAddr?.get(tx.walletAddress);

    const confidence = calculateConfidenceScore(tx, ethPrice, walletPerf, histImpact);
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

    if (tx.valueUSD >= WHALE_TX_THRESHOLD) {
      flow.whaleTxCount++;
      flow.whaleTxValue += tx.valueUSD;
    }

    if (tx.gasPrice) {
      flow.avgGasPriceGwei = (flow.avgGasPriceGwei + tx.gasPrice) / 2;
    }

    if (!tx.isError) {
      flow.successfulTxCount++;
    }

    const w = Math.max(1, tx.valueUSD);
    flow.confidenceFactors.transactionSize += confidence.transactionSize * w;
    flow.confidenceFactors.gasPrice += confidence.gasPrice * w;
    flow.confidenceFactors.toExchange += confidence.toExchange * w;
    flow.confidenceFactors.fromExchange += confidence.fromExchange * w;
    flow.confidenceFactors.successfulTx += confidence.successfulTx * w;
    flow.confidenceFactors.historicalPattern += confidence.historicalPattern * w;
    flow.confidenceScore += confidence.total * w;
    weightBySymbol.set(symbol, (weightBySymbol.get(symbol) ?? 0) + w);


    if (tx.toExchange && !tx.fromExchange) {
      flow.inflowUSD += tx.valueUSD;
      flow.netFlowUSD -= tx.valueUSD;
    } else if (tx.fromExchange && !tx.toExchange) {
      flow.outflowUSD += tx.valueUSD;
      flow.netFlowUSD += tx.valueUSD;
    }
  }

  for (const [symbol, flow] of flowsBySymbol) {
    const totalFlow = flow.inflowUSD + flow.outflowUSD;
    const weightSum = weightBySymbol.get(symbol) ?? 0;

    if (weightSum > 0) {

      flow.confidenceScore = Math.min(100, flow.confidenceScore / weightSum);
      flow.confidenceFactors.transactionSize /= weightSum;
      flow.confidenceFactors.gasPrice /= weightSum;
      flow.confidenceFactors.toExchange /= weightSum;
      flow.confidenceFactors.fromExchange /= weightSum;
      flow.confidenceFactors.successfulTx /= weightSum;
      flow.confidenceFactors.historicalPattern /= weightSum;
    }

    if (totalFlow > 0) {
      flow.intensity = Math.min(100, (totalFlow / 1000000) * 10 * (flow.confidenceScore / 50));

      const ratio = flow.netFlowUSD / totalFlow;
      if (ratio > 0.2) flow.dominantDirection = 'bullish';
      else if (ratio < -0.2) flow.dominantDirection = 'bearish';
      else flow.dominantDirection = 'neutral';
    }
  }

  return flowsBySymbol;
}
