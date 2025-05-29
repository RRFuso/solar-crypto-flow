import { normalizeFeatures } from './featureExtractor';
import { FeatureSet } from '@/types/crypto';

export interface Prediction {
  symbol: string;
  name: string;
  bullish: boolean;
  confidence: number;
  factors: string[];
  timestamp: number;
  price?: string;
}

const predictionCache = new Map<string, { prediction: Prediction; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export function getCachedPrediction(symbol: string): Prediction | null {
  const cached = predictionCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prediction;
  }
  return null;
}

export function storePrediction(prediction: Prediction) {
  predictionCache.set(prediction.symbol, { prediction, timestamp: Date.now() });
}

export function predictPriceMovements(features: FeatureSet[], chartTimeframe: string = '4h'): Prediction[] {
  const normalized = normalizeFeatures(features);
  const weights = getTimeframeWeights(chartTimeframe);
  const predictions: Prediction[] = [];

  for (const f of normalized) {
    const bullScore = scoreBullish(f, weights);
    const bearScore = scoreBearish(f, weights);
    const isBull = bullScore > bearScore;
    const confidence = isBull ? bullScore / (bullScore + bearScore) : bearScore / (bullScore + bullScore);
    const factors = getFactors(f, isBull, chartTimeframe);

    predictions.push({
      symbol: f.symbol,
      name: f.id,
      bullish: isBull,
      confidence: Math.min(0.95, confidence),
      factors,
      timestamp: Date.now(),
      price: f.price
    });
  }

  return predictions;
}

function getTimeframeWeights(tf: string) {
  const map: Record<string, any> = {
    '5m': { tech: 1.5, flow: 1.2, mom: 1.6, fund: 0.3 },
    '15m': { tech: 1.4, flow: 1.1, mom: 1.4, fund: 0.4 },
    '1h': { tech: 1.2, flow: 1.0, mom: 1.1, fund: 0.6 },
    '4h': { tech: 1.0, flow: 1.0, mom: 1.0, fund: 0.8 },
    '24h': { tech: 0.9, flow: 1.0, mom: 0.9, fund: 1.0 },
  };
  return map[tf] || { tech: 1, flow: 1, mom: 1, fund: 1 };
}

function scoreBullish(f: FeatureSet, w: any) {
  let score = 0;
  if (f.rsi < 30) score += 2 * w.tech;
  if (f.macd > f.macdSignal) score += 1.5 * w.tech;
  if (f.divergenceBullish) score += 2.5 * w.tech;
  if (f.aboveMA) score += 1 * w.tech;
  if (f.priceChange1h > 1) score += 1.5 * w.mom;
  if (f.volumeChange24h > 20) score += 1.5 * w.mom;
  if (f.incomingFlows > f.outgoingFlows) score += 1.5 * w.flow;
  return score;
}

function scoreBearish(f: FeatureSet, w: any) {
  let score = 0;
  if (f.rsi > 70) score += 2 * w.tech;
  if (f.macd < f.macdSignal) score += 1.5 * w.tech;
  if (f.divergenceBearish) score += 2.5 * w.tech;
  if (!f.aboveMA) score += 1 * w.tech;
  if (f.priceChange1h < -1) score += 1.5 * w.mom;
  if (f.outgoingFlows > f.incomingFlows) score += 1.5 * w.flow;
  return score;
}

function getFactors(f: FeatureSet, bull: boolean, tf: string): string[] {
  const list = [];
  if (bull) {
    if (f.rsi < 30) list.push("RSI oversold");
    if (f.divergenceBullish) list.push("Bullish divergence");
    if (f.volumeChange24h > 20) list.push("High volume");
  } else {
    if (f.rsi > 70) list.push("RSI overbought");
    if (f.divergenceBearish) list.push("Bearish divergence");
    if (f.volumeChange24h > 20 && f.priceChange24h < 0) list.push("Volume dump");
  }
  if (list.length > 0) list[0] += ` (${tf})`;
  return list;
}
