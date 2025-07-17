
import { CryptoFeatures, normalizeFeatures } from "./featureExtractor";
export type { CryptoFeatures };

export interface Prediction {
  symbol: string;
  name?: string;
  bullish: boolean;
  confidence: number;
  factors: string[];
  timestamp: number;
  price?: string;
  explosivePotential?: 'High' | 'Medium' | 'Low' | 'None';
  isBreakout?: boolean;
  isExpansion?: boolean;
  isAccelerating?: boolean;
  rsi?: number; // Adicionado
  rsi4h?: number; // Adicionado
  divergenceBullish?: boolean; // Adicionado
  divergenceBearish?: boolean; // Adicionado
}

export interface HistoricalData {
  symbol: string;
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  priceChange24h: number;
}

export interface PriceActionSignal {
  symbol: string;
  explosivePotential: 'High' | 'Medium' | 'Low' | 'None';
  isBreakout: boolean;
  isExpansion: boolean;
  isAccelerating: boolean;
  lastUpdated: number;
}

// Constantes para análise de price action
const VOLUME_AVG_PERIOD = 20;
const VOLUME_BREAKOUT_MULTIPLIER = 1.5;
const PRICE_BREAKOUT_THRESHOLD = 3; // % mínimo de mudança de preço
const VOLATILITY_THRESHOLD_LOW = 2; // % baixa volatilidade
const VOLATILITY_THRESHOLD_HIGH = 8; // % alta volatilidade  
const MOMENTUM_ACCELERATION_THRESHOLD = 1.5; // multiplicador de aceleração
const RSI_OVERSOLD_THRESHOLD = 30;
const RSI_OVERBOUGHT_THRESHOLD = 70;

// Cache de previsões
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
    timestamp: Date.now(),
  });
}

// Função para calcular média móvel simples do volume
function calculateVolumeSMA(historicalData: HistoricalData[], period: number): number {
  if (historicalData.length < period) return 0;
  
  const recentData = historicalData.slice(-period);
  const totalVolume = recentData.reduce((sum, data) => sum + data.volume, 0);
  return totalVolume / period;
}

// Deteção de breakout de preço/volume
function detectPriceVolumeBreakout(currentData: CryptoFeatures, historicalData: HistoricalData[]): boolean {
  if (historicalData.length < VOLUME_AVG_PERIOD) return false;
  
  const avgVolume = calculateVolumeSMA(historicalData, VOLUME_AVG_PERIOD);
  const currentVolume = currentData.volume || 0;
  const priceChange = Math.abs(currentData.priceChange24h || 0);
  
  // Breakout: volume acima da média E mudança significativa de preço
  const volumeBreakout = currentVolume > (avgVolume * VOLUME_BREAKOUT_MULTIPLIER);
  const priceBreakout = priceChange > PRICE_BREAKOUT_THRESHOLD;
  
  return volumeBreakout && priceBreakout;
}

// Deteção de expansão de volatilidade após compressão
function detectVolatilityExpansion(currentData: CryptoFeatures, historicalData: HistoricalData[]): boolean {
  if (historicalData.length < 10) return false;
  
  const recentData = historicalData.slice(-7); // últimos 7 dias
  const previousData = historicalData.slice(-14, -7); // 7 dias anteriores
  
  // Calcular volatilidade média dos períodos
  const recentVolatility = recentData.reduce((sum, data) => sum + Math.abs(data.priceChange24h), 0) / recentData.length;
  const previousVolatility = previousData.reduce((sum, data) => sum + Math.abs(data.priceChange24h), 0) / previousData.length;
  
  const currentVolatility = Math.abs(currentData.priceChange24h || 0);
  
  // Expansão: período anterior com baixa volatilidade seguido de alta volatilidade atual
  const wasCompressed = previousVolatility < VOLATILITY_THRESHOLD_LOW;
  const isExpanding = currentVolatility > VOLATILITY_THRESHOLD_HIGH;
  
  return wasCompressed && isExpanding;
}

// Deteção de aceleração de momentum
function detectMomentumAcceleration(currentData: CryptoFeatures): boolean {
  const priceChange1h = currentData.priceChange1h || 0;
  const priceChange24h = currentData.priceChange24h || 0;
  const volumeChange = currentData.volumeChange24h || 0;
  
  // Aceleração: movimento de preço recente mais forte que médio E volume crescente
  const priceAcceleration = Math.abs(priceChange1h) > (Math.abs(priceChange24h) / 24 * MOMENTUM_ACCELERATION_THRESHOLD);
  const volumeSupport = volumeChange > 10; // volume 10% acima do normal
  const rsiMomentum = (currentData.rsi > 50 && priceChange1h > 0) || (currentData.rsi < 50 && priceChange1h < 0);
  
  return priceAcceleration && volumeSupport && rsiMomentum;
}

// Análise principal de price action
export function analyzeCryptoWithPriceAction(
  currentData: CryptoFeatures,
  historicalData: HistoricalData[]
): PriceActionSignal {
  const isBreakout = detectPriceVolumeBreakout(currentData, historicalData);
  const isExpansion = detectVolatilityExpansion(currentData, historicalData);
  const isAccelerating = detectMomentumAcceleration(currentData);
  
  // Determinar potencial explosivo baseado nos sinais
  let explosivePotential: 'High' | 'Medium' | 'Low' | 'None' = 'None';
  
  const signalCount = [isBreakout, isExpansion, isAccelerating].filter(Boolean).length;
  
  if (signalCount >= 3) {
    explosivePotential = 'High';
  } else if (signalCount === 2) {
    explosivePotential = 'Medium';
  } else if (signalCount === 1) {
    explosivePotential = 'Low';
  }
  
  // Boost baseado em condições técnicas favoráveis
  if (explosivePotential !== 'None') {
    const rsi = currentData.rsi || 50;
    const macdPositive = (currentData.macd || 0) > (currentData.macdSignal || 0);
    
    // RSI em zona favorável + MACD positivo = upgrade do sinal
    if ((rsi < RSI_OVERSOLD_THRESHOLD || (rsi > 40 && rsi < 60)) && macdPositive) {
      if (explosivePotential === 'Medium') explosivePotential = 'High';
      else if (explosivePotential === 'Low') explosivePotential = 'Medium';
    }
  }
  
  return {
    symbol: currentData.symbol,
    explosivePotential,
    isBreakout,
    isExpansion,
    isAccelerating,
    lastUpdated: Date.now()
  };
}

export function predictPriceMovements(
  features: CryptoFeatures[],
  chartTimeframe: string = "4h",
  historicalDataMap?: Map<string, HistoricalData[]>
): Prediction[] {
  const normalized = normalizeFeatures(features);
  const weights = getTimeframeWeights(chartTimeframe);
  const predictions: Prediction[] = [];

  for (const feat of normalized) {
    const bull = scoreBullish(feat, weights);
    const bear = scoreBearish(feat, weights);
    const isBullish = bull > bear;
    const conf = isBullish ? bull / (bull + bear) : bear / (bull + bear);
    const factors = getFactors(feat, isBullish, chartTimeframe);

    // Análise de price action se dados históricos disponíveis
    let priceActionData: PriceActionSignal | undefined;
    if (historicalDataMap?.has(feat.symbol)) {
      const historicalData = historicalDataMap.get(feat.symbol)!;
      priceActionData = analyzeCryptoWithPriceAction(feat, historicalData);
    }

    predictions.push({
      symbol: feat.symbol,
      name: feat.id,
      bullish: isBullish,
      confidence: Math.min(0.95, conf),
      factors,
      timestamp: Date.now(),
      price: feat.price.toString(),
      explosivePotential: priceActionData?.explosivePotential || 'None',
      isBreakout: priceActionData?.isBreakout || false,
      isExpansion: priceActionData?.isExpansion || false,
      isAccelerating: priceActionData?.isAccelerating || false,
      rsi: feat.rsi, // Preencher RSI
      rsi4h: feat.rsi4h, // Preencher RSI4h
      divergenceBullish: feat.divergenceBullish, // Preencher divergência bullish
      divergenceBearish: feat.divergenceBearish, // Preencher divergência bearish
    });
  }

  return predictions;
}

function getTimeframeWeights(timeframe: string) {
  switch (timeframe) {
    case "5m": return { tech: 1.5, fund: 0.3, flow: 1.2, mom: 1.6 };
    case "15m": return { tech: 1.4, fund: 0.4, flow: 1.1, mom: 1.4 };
    case "1h": return { tech: 1.2, fund: 0.6, flow: 1.0, mom: 1.1 };
    case "4h": return { tech: 1.0, fund: 0.8, flow: 1.0, mom: 1.0 };
    case "24h": return { tech: 0.9, fund: 1.0, flow: 1.0, mom: 0.9 };
    default: return { tech: 1.0, fund: 1.0, flow: 1.0, mom: 1.0 };
  }
}

interface Weights {
  tech: number;
  fund: number;
  flow: number;
  mom: number;
}

function scoreBullish(f: CryptoFeatures, w: Weights): number {
  let s = 0;

  if (f.rsi < 30) s += 2 * w.tech;
  if (f.rsi4h < 40 && f.rsi4h > 30) s += 1.5 * w.tech;
  if (f.macd > f.macdSignal) s += 1.5 * w.tech;
  if (f.macdHistogram > 0) s += 1 * w.tech;
  if (f.aboveMA) s += 1 * w.tech;

  if (f.priceChange1h > 1) s += 2 * w.mom;
  if (f.priceChange24h > 5) s += 1 * w.fund;

  if (f.volumeChange24h > 20) s += 1.5 * w.mom;
  if (f.obv > 0) s += 1 * w.mom;

  if (f.netFlowPercentage > 0) s += 1 * w.flow;
  if (f.incomingFlows > f.outgoingFlows) s += 1.5 * w.flow;
  if (f.exchangeOutflow > f.exchangeInflow) s += 1 * w.flow;

  return s;
}

function scoreBearish(f: CryptoFeatures, w: any): number {
  let s = 0;

  if (f.rsi > 70) s += 2 * w.tech;
  if (f.rsi4h > 70) s += 1.5 * w.tech;
  if (f.macd < f.macdSignal) s += 1.5 * w.tech;
  if (f.macdHistogram < 0) s += 1 * w.tech;
  if (!f.aboveMA) s += 1 * w.tech;

  if (f.priceChange1h < -1) s += 2 * w.mom;
  if (f.priceChange24h < -5) s += 1 * w.fund;

  if (f.volumeChange24h > 20 && f.priceChange24h < 0) s += 2 * w.mom;
  if (f.obv < 0) s += 1 * w.mom;

  if (f.netFlowPercentage < 0) s += 1 * w.flow;
  if (f.outgoingFlows > f.incomingFlows) s += 1.5 * w.flow;
  if (f.exchangeInflow > f.exchangeOutflow) s += 1 * w.flow;

  return s;
}

function getFactors(f: CryptoFeatures, bull: boolean, tf: string): string[] {
  const list: string[] = [];

  if (bull) {
    if (f.rsi < 30) list.push("RSI oversold");
    if (f.macd > f.macdSignal) list.push("MACD bullish crossover");
    if (f.macdHistogram > 0) list.push("MACD histogram positivo");
    if (f.volumeChange24h > 20) list.push("Volume alto");
    if (f.netFlowPercentage > 1) list.push("Forte fluxo positivo");
  } else {
    if (f.rsi > 70) list.push("RSI overbought");
    if (f.macd < f.macdSignal) list.push("MACD bearish crossover");
    if (f.macdHistogram < 0) list.push("MACD histogram negativo");
    if (f.volumeChange24h > 20 && f.priceChange24h < 0) list.push("Venda com volume alto");
    if (f.netFlowPercentage < -1) list.push("Forte fluxo negativo");
  }

  if (list.length > 0) list[0] += ` (${tf})`;
  return list.slice(0, 3);
}
