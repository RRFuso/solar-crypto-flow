
import { CryptoFeatures, normalizeFeatures } from "./featureExtractor";

export interface Prediction {
  symbol: string;
  name?: string;
  bullish: boolean;
  confidence: number;
  factors: string[];
  timestamp: number;
  price?: string;
}

// Cache (15 min)
const predictionCache = new Map<string, { prediction: Prediction, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15;

export function getCachedPrediction(symbol: string): Prediction | null {
  const cached = predictionCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prediction;
  }
  return null;
}

export function storePrediction(prediction: Prediction): void {
  predictionCache.set(prediction.symbol, {
    prediction,
    timestamp: Date.now()
  });
}

export function predictPriceMovements(
  features: CryptoFeatures[],
  chartTimeframe: string = '4h'
): Prediction[] {
  const normalized = normalizeFeatures(features);
  const predictions: Prediction[] = [];

  normalized.forEach(feature => {
    const weights = getTimeframeWeights(chartTimeframe);
    const bullish = calcBullishScore(feature, weights);
    const bearish = calcBearishScore(feature, weights);
    const isBullish = bullish > bearish;

    const confidence = isBullish
      ? bullish / (bullish + bearish)
      : bearish / (bullish + bearish);

    const factors = identifyFactors(feature, isBullish, chartTimeframe);

    predictions.push({
      symbol: feature.symbol,
      name: feature.id,
      bullish: isBullish,
      confidence: Math.min(0.97, confidence),
      factors,
      timestamp: Date.now(),
      price: feature.price
    });
  });

  return predictions;
}

function getTimeframeWeights(timeframe: string) {
  switch (timeframe) {
    case '5m': return { technical: 1.5, fundamental: 0.3, flow: 1.2, momentum: 1.6 };
    case '15m': return { technical: 1.4, fundamental: 0.4, flow: 1.1, momentum: 1.4 };
    case '30m': return { technical: 1.3, fundamental: 0.5, flow: 1.1, momentum: 1.2 };
    case '1h': return { technical: 1.2, fundamental: 0.6, flow: 1.0, momentum: 1.1 };
    case '4h': return { technical: 1.0, fundamental: 0.8, flow: 1.0, momentum: 1.0 };
    case '24h': return { technical: 0.9, fundamental: 1.0, flow: 1.0, momentum: 0.9 };
    case '7d': return { technical: 0.7, fundamental: 1.2, flow: 0.8, momentum: 0.7 };
    default: return { technical: 1.0, fundamental: 1.0, flow: 1.0, momentum: 1.0 };
  }
}

function calcBullishScore(f: CryptoFeatures, w: any): number {
  let score = 0;

  if (f.rsi < 30) score += 2 * w.technical;
  if (f.rsi4h < 40 && f.rsi4h > 30) score += 1.5 * w.technical;
  if (f.macd > f.macdSignal) score += 1.5 * w.technical;
  if (f.aboveMA) score += 1 * w.technical;
  if (f.macdHistogram > 0) score += 1 * w.technical;

  if (f.priceChange1h > 0) score += 1 * w.momentum;
  if (f.priceChange24h > 0) score += 0.5 * w.momentum;
  if (f.priceChange7d > 0) score += 0.2 * w.fundamental;
  if (f.priceChange1h > 1) score += 2 * w.momentum;
  if (f.priceChange24h > 5) score += 1 * w.fundamental;

  if (f.volumeChange24h > 20) score += 1.5 * w.momentum;
  if (f.obv > 0) score += 1 * w.momentum;

  if (f.netFlowPercentage > 0) score += 1 * w.flow;
  if (f.incomingFlows > f.outgoingFlows) score += 1.5 * w.flow;
  if (f.exchangeOutflow > f.exchangeInflow) score += 1 * w.flow;
  if (f.fundingRate > -0.01 && f.fundingRate < 0.01) score += 0.5 * w.flow;

  return score;
}

function calcBearishScore(f: CryptoFeatures, w: any): number {
  let score = 0;

  if (f.rsi > 70) score += 2 * w.technical;
  if (f.rsi4h > 70) score += 1.5 * w.technical;
  if (f.macd < f.macdSignal) score += 1.5 * w.technical;
  if (!f.aboveMA) score += 1 * w.technical;
  if (f.macdHistogram < 0) score += 1 * w.technical;

  if (f.priceChange1h < 0) score += 1 * w.momentum;
  if (f.priceChange24h < 0) score += 0.5 * w.momentum;
  if (f.priceChange7d < 0) score += 0.2 * w.fundamental;
  if (f.priceChange1h < -1) score += 2 * w.momentum;
  if (f.priceChange24h < -5) score += 1 * w.fundamental;

  if (f.volumeChange24h > 20 && f.priceChange24h < 0) score += 2 * w.momentum;
  if (f.obv < 0) score += 1 * w.momentum;

  if (f.netFlowPercentage < 0) score += 1 * w.flow;
  if (f.outgoingFlows > f.incomingFlows) score += 1.5 * w.flow;
  if (f.exchangeInflow > f.exchangeOutflow) score += 1 * w.flow;
  if (f.fundingRate > 0.01) score += 1 * w.flow;

  return score;
}

function identifyFactors(f: CryptoFeatures, bullish: boolean, tf: string): string[] {
  const out: string[] = [];

  if (bullish) {
    if (f.rsi < 30) out.push("RSI oversold");
    if (f.rsi4h < 40 && f.rsi4h > 30) out.push("RSI recovering (4h)");
    if (f.macd > f.macdSignal) out.push("MACD bullish crossover");
    if (f.macdHistogram > 0 && f.macdHistogram > f.macdSignal) out.push("MACD positive momentum");
    if (f.aboveMA) out.push("Above EMA");
    if (f.priceChange1h > 1) out.push("Short-term price surge");
    if (f.volumeChange24h > 20) out.push("High volume");
    if (f.obv > 0 && f.priceChange24h > 0) out.push("OBV support");
    if (f.netFlowPercentage > 1) out.push("Capital inflow");
    if (f.exchangeOutflow > f.exchangeInflow * 1.5) out.push("Exchange outflow");
  } else {
    if (f.rsi > 70) out.push("RSI overbought");
    if (f.rsi4h > 70) out.push("RSI overbought (4h)");
    if (f.macd < f.macdSignal) out.push("MACD bearish crossover");
    if (f.macdHistogram < 0 && f.macdHistogram < f.macdSignal) out.push("MACD negative");
    if (!f.aboveMA) out.push("Below EMA");
    if (f.priceChange1h < -1) out.push("Short-term price drop");
    if (f.volumeChange24h > 20 && f.priceChange24h < 0) out.push("High selling volume");
    if (f.obv < 0) out.push("Negative OBV");
    if (f.netFlowPercentage < -1) out.push("Capital outflow");
    if (f.exchangeInflow > f.exchangeOutflow * 1.5) out.push("Exchange inflow");
  }

  if (out.length > 0) out[0] += ` (${tf})`;
  return out.slice(0, 4);
}
