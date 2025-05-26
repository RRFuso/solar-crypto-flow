
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

const predictionCache = new Map<string, { prediction: Prediction; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutos

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
  chartTimeframe: string = "4h"
): Prediction[] {
  const normalizedFeatures = normalizeFeatures(features);
  const predictions: Prediction[] = [];

  normalizedFeatures.forEach(feature => {
    const weights = getTimeframeWeights(chartTimeframe);
    const bullishScore = calculateBullishScore(feature, weights);
    const bearishScore = calculateBearishScore(feature, weights);

    const isBullish = bullishScore > bearishScore;
    const confidence = isBullish
      ? bullishScore / (bullishScore + bearishScore)
      : bearishScore / (bullishScore + bearishScore);

    const factors = identifyFactors(feature, isBullish, chartTimeframe);

    predictions.push({
      symbol: feature.symbol,
      name: feature.id,
      bullish: isBullish,
      confidence: Math.min(0.95, confidence),
      factors,
      timestamp: Date.now(),
      price: feature.price
    });
  });

  return predictions;
}

function getTimeframeWeights(timeframe: string) {
  switch (timeframe) {
    case "5m":
      return { technical: 1.5, fundamental: 0.3, flow: 1.2, momentum: 1.6 };
    case "15m":
      return { technical: 1.4, fundamental: 0.4, flow: 1.1, momentum: 1.4 };
    case "30m":
      return { technical: 1.3, fundamental: 0.5, flow: 1.1, momentum: 1.2 };
    case "1h":
      return { technical: 1.2, fundamental: 0.6, flow: 1.0, momentum: 1.1 };
    case "4h":
      return { technical: 1.0, fundamental: 0.8, flow: 1.0, momentum: 1.0 };
    case "24h":
      return { technical: 0.9, fundamental: 1.0, flow: 1.0, momentum: 0.9 };
    case "7d":
      return { technical: 0.7, fundamental: 1.2, flow: 0.8, momentum: 0.7 };
    default:
      return { technical: 1.0, fundamental: 1.0, flow: 1.0, momentum: 1.0 };
  }
}

function calculateBullishScore(feature: CryptoFeatures, w: any): number {
  let score = 0;
  if (feature.rsi < 30) score += 2 * w.technical;
  if (feature.rsi4h > 30 && feature.rsi4h < 40) score += 1.5 * w.technical;
  if (feature.macd > feature.macdSignal) score += 1.5 * w.technical;
  if (feature.aboveMA) score += 1 * w.technical;
  if (feature.macdHistogram > 0) score += 1 * w.technical;

  if (feature.priceChange1h > 0) score += 1 * w.momentum;
  if (feature.priceChange1h > 1) score += 2 * w.momentum;
  if (feature.priceChange24h > 0) score += 0.5 * w.momentum;
  if (feature.priceChange24h > 5) score += 1 * w.fundamental;

  if (feature.volumeChange24h > 20) score += 1.5 * w.momentum;
  if (feature.obv > 0) score += 1 * w.momentum;

  if (feature.netFlowPercentage > 0) score += 1 * w.flow;
  if (feature.incomingFlows > feature.outgoingFlows) score += 1.5 * w.flow;
  if (feature.exchangeOutflow > feature.exchangeInflow) score += 1 * w.flow;
  if (feature.fundingRate > -0.01 && feature.fundingRate < 0.01) score += 0.5 * w.flow;

  return score;
}

function calculateBearishScore(feature: CryptoFeatures, w: any): number {
  let score = 0;
  if (feature.rsi > 70) score += 2 * w.technical;
  if (feature.rsi4h > 70) score += 1.5 * w.technical;
  if (feature.macd < feature.macdSignal) score += 1.5 * w.technical;
  if (!feature.aboveMA) score += 1 * w.technical;
  if (feature.macdHistogram < 0) score += 1 * w.technical;

  if (feature.priceChange1h < 0) score += 1 * w.momentum;
  if (feature.priceChange1h < -1) score += 2 * w.momentum;
  if (feature.priceChange24h < 0) score += 0.5 * w.momentum;
  if (feature.priceChange24h < -5) score += 1 * w.fundamental;

  if (feature.priceChange24h < 0 && feature.volumeChange24h > 20) score += 2 * w.momentum;
  if (feature.obv < 0) score += 1 * w.momentum;

  if (feature.netFlowPercentage < 0) score += 1 * w.flow;
  if (feature.outgoingFlows > feature.incomingFlows) score += 1.5 * w.flow;
  if (feature.exchangeInflow > feature.exchangeOutflow) score += 1 * w.flow;
  if (feature.fundingRate > 0.01) score += 1 * w.flow;

  return score;
}

function identifyFactors(feature: CryptoFeatures, isBullish: boolean, timeframe: string): string[] {
  const factors: string[] = [];

  if (isBullish) {
    if (feature.rsi < 30) factors.push("RSI oversold");
    if (feature.rsi4h > 30 && feature.rsi4h < 40) factors.push("RSI recovery");
    if (feature.macd > feature.macdSignal) factors.push("MACD bullish crossover");
    if (feature.macdHistogram > 0) factors.push("MACD positive momentum");
    if (feature.aboveMA) factors.push("Price above MA");
    if (feature.priceChange1h > 1) factors.push("Price surge 1h");
    if (feature.volumeChange24h > 20) factors.push("Volume spike");
    if (feature.obv > 0) factors.push("Positive OBV");
    if (feature.netFlowPercentage > 1) factors.push("Strong inflow");
    if (feature.exchangeOutflow > feature.exchangeInflow * 1.5) factors.push("Exchange outflow");
  } else {
    if (feature.rsi > 70) factors.push("RSI overbought");
    if (feature.rsi4h > 70) factors.push("4h RSI overbought");
    if (feature.macd < feature.macdSignal) factors.push("MACD bearish crossover");
    if (feature.macdHistogram < 0) factors.push("MACD negative momentum");
    if (!feature.aboveMA) factors.push("Price below MA");
    if (feature.priceChange1h < -1) factors.push("Price drop 1h");
    if (feature.volumeChange24h > 20 && feature.priceChange24h < 0) factors.push("High volume sell-off");
    if (feature.obv < 0) factors.push("Negative OBV");
    if (feature.netFlowPercentage < -1) factors.push("Capital outflow");
    if (feature.exchangeInflow > feature.exchangeOutflow * 1.5) factors.push("Exchange inflow");
  }

  if (factors.length) {
    factors[0] = `${factors[0]} (${timeframe})`;
  }

  return factors.slice(0, 3);
}
