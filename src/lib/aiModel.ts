import { normalizeFeatures } from './featureExtractor';

const predictionCache = new Map();
const CACHE_TTL = 1000 * 60 * 15;

export function getCachedPrediction(symbol: string) {
  const cached = predictionCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prediction;
  }
  return null;
}

export function storePrediction(prediction: any) {
  predictionCache.set(prediction.symbol, {
    prediction,
    timestamp: Date.now()
  });
}

export function predictPriceMovements(features: any[], chartTimeframe = '4h') {
  const normalized = normalizeFeatures(features);
  const weights = getTimeframeWeights(chartTimeframe);
  const predictions = [];

  for (const f of normalized) {
    const bull = scoreBullish(f, weights);
    const bear = scoreBearish(f, weights);
    const isBullish = bull > bear;
    const confidence = isBullish
      ? bull / (bull + bear + 0.01)
      : bear / (bull + bear + 0.01);

    const factors = getFactors(f, isBullish, chartTimeframe);
    predictions.push({
      symbol: f.symbol,
      name: f.id,
      bullish: isBullish,
      confidence: Math.min(0.95, confidence),
      factors,
      timestamp: Date.now(),
      price: f.price
    });
  }

  return predictions;
}

function getTimeframeWeights(tf: string) {
  const weightSets = {
    '5m':    { tech: 1.6, fund: 0.2, flow: 1.6, mom: 1.6 },
    '15m':   { tech: 1.4, fund: 0.4, flow: 1.4, mom: 1.3 },
    '1h':    { tech: 1.2, fund: 0.7, flow: 1.2, mom: 1.1 },
    '4h':    { tech: 1.0, fund: 1.0, flow: 1.0, mom: 1.0 },
    '24h':   { tech: 0.9, fund: 1.2, flow: 1.0, mom: 0.9 }
  };
  return weightSets[tf] || weightSets['4h'];
}

function scoreBullish(f: any, w: any) {
  let s = 0;

  if (f.rsi < 30) s += 2.5 * w.tech;
  if (f.rsi4h < 40 && f.rsi4h > 25) s += 1.8 * w.tech;
  if (f.macd > f.macdSignal) s += 1.5 * w.tech;
  if (f.aboveMA) s += 1.2 * w.tech;
  if (f.priceChange1h > 1.5) s += 2.2 * w.mom;
  if (f.volumeChange24h > 25) s += 1.6 * w.mom;
  if (f.obv > 0) s += 1.3 * w.mom;
  if (f.divergenceBullish) s += 2.4 * w.tech;
  if (f.netFlowPercentage > 1) s += 1.4 * w.flow;
  if (f.exchangeOutflow > f.exchangeInflow) s += 1.2 * w.flow;

  return s;
}

function scoreBearish(f: any, w: any) {
  let s = 0;

  if (f.rsi > 70) s += 2.5 * w.tech;
  if (f.rsi4h > 70) s += 1.5 * w.tech;
  if (f.macd < f.macdSignal) s += 1.6 * w.tech;
  if (!f.aboveMA) s += 1.3 * w.tech;
  if (f.priceChange1h < -1.5) s += 2.1 * w.mom;
  if (f.volumeChange24h > 20 && f.priceChange24h < 0) s += 2.0 * w.mom;
  if (f.obv < 0) s += 1.5 * w.mom;
  if (f.divergenceBearish) s += 2.8 * w.tech;
  if (f.netFlowPercentage < -1) s += 1.5 * w.flow;
  if (f.exchangeInflow > f.exchangeOutflow) s += 1.3 * w.flow;
  if (f.lateralBearish) s += 2.2 * w.mom;

  return s;
}

function getFactors(f: any, bull: boolean, tf: string) {
  const list: string[] = [];

  if (bull) {
    if (f.divergenceBullish) list.push("Bullish divergence");
    if (f.rsi < 30) list.push("RSI oversold");
    if (f.macd > f.macdSignal) list.push("MACD bullish crossover");
    if (f.netFlowPercentage > 1) list.push("Net positive capital flow");
  } else {
    if (f.divergenceBearish) list.push("Bearish divergence");
    if (f.rsi > 70) list.push("RSI overbought");
    if (f.macd < f.macdSignal) list.push("MACD bearish crossover");
    if (f.lateralBearish) list.push("Weakness in lateral zone");
  }

  if (list.length > 0) list[0] += ` (${tf})`;
  return list.slice(0, 3);
}
