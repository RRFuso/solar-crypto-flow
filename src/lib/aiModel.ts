
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

// Cache for predictions
const predictionCache = new Map<string, { prediction: Prediction, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

/**
 * Gets a cached prediction if it exists and is not expired
 */
export function getCachedPrediction(symbol: string): Prediction | null {
  const cached = predictionCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prediction;
  }
  return null;
}

/**
 * Stores a prediction in the cache
 */
export function storePrediction(prediction: Prediction): void {
  predictionCache.set(prediction.symbol, {
    prediction,
    timestamp: Date.now()
  });
}

/**
 * Predicts price movements based on extracted features
 */
export function predictPriceMovements(
  features: CryptoFeatures[],
  chartTimeframe: string = '4h'
): Prediction[] {
  // Normalize features for consistent comparisons
  const normalizedFeatures = normalizeFeatures(features);
  const predictions: Prediction[] = [];

  normalizedFeatures.forEach(feature => {
    // Different score weights based on timeframe
    const weights = getTimeframeWeights(chartTimeframe);
    
    // Calculate scores using weighted features
    const bullishScore = calculateBullishScore(feature, weights);
    const bearishScore = calculateBearishScore(feature, weights);
    
    // Determine if bullish or bearish
    const isBullish = bullishScore > bearishScore;
    const confidence = isBullish 
      ? bullishScore / (bullishScore + bearishScore)
      : bearishScore / (bullishScore + bearishScore);
    
    // Identify key factors in prediction
    const factors = identifyFactors(feature, isBullish, chartTimeframe);
    
    // Create prediction object
    predictions.push({
      symbol: feature.symbol,
      name: feature.id,
      bullish: isBullish,
      confidence: Math.min(0.95, confidence), // Cap at 95% confidence
      factors,
      timestamp: Date.now(),
      price: feature.price
    });
  });
  
  return predictions;
}

/**
 * Get weight multipliers for different timeframes
 */
function getTimeframeWeights(timeframe: string) {
  switch (timeframe) {
    case '5m':
      return {
        technical: 1.5,  // Heavy emphasis on short-term technical
        fundamental: 0.3, // Very little fundamental weight
        flow: 1.2,       // Flow is important
        momentum: 1.6    // Momentum is crucial
      };
    case '15m':
      return {
        technical: 1.4,
        fundamental: 0.4,
        flow: 1.1,
        momentum: 1.4
      };
    case '30m':
      return {
        technical: 1.3,
        fundamental: 0.5,
        flow: 1.1,
        momentum: 1.2
      };
    case '1h':
      return {
        technical: 1.2,
        fundamental: 0.6,
        flow: 1.0,
        momentum: 1.1
      };
    case '4h':
      return {
        technical: 1.0, // Balanced
        fundamental: 0.8,
        flow: 1.0,
        momentum: 1.0
      };
    case '24h':
      return {
        technical: 0.9,
        fundamental: 1.0, // More fundamental weight
        flow: 1.0,
        momentum: 0.9
      };
    case '7d':
      return {
        technical: 0.7,
        fundamental: 1.2, // Heavy emphasis on fundamentals
        flow: 0.8,
        momentum: 0.7
      };
    default:
      return {
        technical: 1.0,
        fundamental: 1.0,
        flow: 1.0,
        momentum: 1.0
      };
  }
}

/**
 * Calculate bullish score based on features
 */
function calculateBullishScore(feature: CryptoFeatures, weights: any): number {
  let score = 0;
  
  // Technical indicators
  if (feature.rsi < 30) score += 2 * weights.technical; // Oversold
  if (feature.rsi4h < 40 && feature.rsi4h > 30) score += 1.5 * weights.technical; // Rising from oversold
  if (feature.macd > feature.macdSignal) score += 1.5 * weights.technical; // MACD crossing up
  if (feature.aboveMA) score += 1 * weights.technical; // Above moving average
  if (feature.macdHistogram > 0) score += 1 * weights.technical; // Positive MACD histogram
  
  // Price changes
  if (feature.priceChange1h > 0) score += 1 * weights.momentum;
  if (feature.priceChange24h > 0) score += 0.5 * weights.momentum;
  if (feature.priceChange7d > 0) score += 0.2 * weights.fundamental;
  if (feature.priceChange1h > 1) score += 2 * weights.momentum; // Strong short-term momentum
  if (feature.priceChange24h > 5) score += 1 * weights.fundamental; // Strong daily gains
  
  // Volume
  if (feature.volumeChange24h > 20) score += 1.5 * weights.momentum; // Volume surge
  if (feature.obv > 0) score += 1 * weights.momentum; // On-balance volume positive
  
  // Capital flows
  if (feature.netFlowPercentage > 0) score += 1 * weights.flow; // Net inflow
  if (feature.incomingFlows > feature.outgoingFlows) score += 1.5 * weights.flow; // More inflows than outflows
  if (feature.exchangeOutflow > feature.exchangeInflow) score += 1 * weights.flow; // Coins leaving exchanges (bullish)
  if (feature.fundingRate < 0.01 && feature.fundingRate > -0.01) score += 0.5 * weights.flow; // Neutral funding rate
  
  return score;
}

/**
 * Calculate bearish score based on features
 */
function calculateBearishScore(feature: CryptoFeatures, weights: any): number {
  let score = 0;
  
  // Technical indicators
  if (feature.rsi > 70) score += 2 * weights.technical; // Overbought
  if (feature.rsi4h > 70) score += 1.5 * weights.technical; // 4h overbought
  if (feature.macd < feature.macdSignal) score += 1.5 * weights.technical; // MACD crossing down
  if (!feature.aboveMA) score += 1 * weights.technical; // Below moving average
  if (feature.macdHistogram < 0) score += 1 * weights.technical; // Negative MACD histogram
  
  // Price changes
  if (feature.priceChange1h < 0) score += 1 * weights.momentum;
  if (feature.priceChange24h < 0) score += 0.5 * weights.momentum;
  if (feature.priceChange7d < 0) score += 0.2 * weights.fundamental;
  if (feature.priceChange1h < -1) score += 2 * weights.momentum; // Strong short-term negative momentum
  if (feature.priceChange24h < -5) score += 1 * weights.fundamental; // Strong daily losses
  
  // Volume on down moves
  if (feature.priceChange24h < 0 && feature.volumeChange24h > 20) score += 2 * weights.momentum; // Down on high volume
  if (feature.obv < 0) score += 1 * weights.momentum; // On-balance volume negative
  
  // Capital flows
  if (feature.netFlowPercentage < 0) score += 1 * weights.flow; // Net outflow
  if (feature.outgoingFlows > feature.incomingFlows) score += 1.5 * weights.flow; // More outflows than inflows
  if (feature.exchangeInflow > feature.exchangeOutflow) score += 1 * weights.flow; // Coins entering exchanges (bearish)
  if (feature.fundingRate > 0.01) score += 1 * weights.flow; // High funding rate (overleveraged longs)
  
  return score;
}

/**
 * Identify key factors that led to the prediction
 */
function identifyFactors(feature: CryptoFeatures, isBullish: boolean, timeframe: string): string[] {
  const factors: string[] = [];
  
  if (isBullish) {
    // Bullish factors
    if (feature.rsi < 30) factors.push("RSI oversold");
    if (feature.rsi4h < 40 && feature.rsi4h > 30) factors.push("RSI rising from oversold");
    if (feature.macd > feature.macdSignal) factors.push("MACD bullish crossover");
    if (feature.macdHistogram > 0 && feature.macdHistogram > feature.macdSignal) factors.push("MACD momentum");
    if (feature.aboveMA) factors.push("Above EMA");
    if (feature.priceChange1h > 1) factors.push("Hourly price surge");
    if (feature.volumeChange24h > 20) factors.push("Volume spike");
    if (feature.obv > 0 && feature.priceChange24h > 0) factors.push("OBV confirmation");
    if (feature.netFlowPercentage > 1) factors.push("Strong capital inflow");
    if (feature.exchangeOutflow > feature.exchangeInflow * 1.5) factors.push("Exchange outflow");
  } else {
    // Bearish factors
    if (feature.rsi > 70) factors.push("RSI overbought");
    if (feature.rsi4h > 70) factors.push("4H RSI overbought");
    if (feature.macd < feature.macdSignal) factors.push("MACD bearish crossover");
    if (feature.macdHistogram < 0 && feature.macdHistogram < feature.macdSignal) factors.push("MACD downtrend");
    if (!feature.aboveMA) factors.push("Below EMA");
    if (feature.priceChange1h < -1) factors.push("Hourly price drop");
    if (feature.volumeChange24h > 20 && feature.priceChange24h < 0) factors.push("Selling volume");
    if (feature.obv < 0) factors.push("Negative OBV");
    if (feature.netFlowPercentage < -1) factors.push("Capital outflow");
    if (feature.exchangeInflow > feature.exchangeOutflow * 1.5) factors.push("Exchange inflow");
  }

  // Add timeframe to the first factor for context
  if (factors.length > 0) {
    factors[0] = `${factors[0]} (${timeframe})`;
  }
  
  // Limit to 3 most important factors
  return factors.slice(0, 3);
}
