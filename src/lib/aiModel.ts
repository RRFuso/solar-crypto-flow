import * as tf from '@tensorflow/tfjs';
import { CryptoFeatures } from './featureExtractor';

export interface Prediction {
  symbol: string;
  bullish: boolean;
  confidence: number;
  factors: string[];
}

// Feature importance rankings for explainability
const FEATURE_IMPORTANCE: Record<string, number> = {
  rsi: 0.85,
  priceChange1h: 0.75,
  netFlowPercentage: 0.9,
  macdHistogram: 0.8,
  volumeChange24h: 0.7,
  exchangeInflow: 0.6,
  exchangeOutflow: 0.6,
  fundingRate: 0.75,
  aboveMA: 0.65,
  rsi4h: 0.7,
};

/**
 * Simplified model that uses heuristics and rules to predict crypto price movements
 * In a real app, this would be a proper ML model trained on historical data
 */
export function predictPriceMovements(features: CryptoFeatures[]): Prediction[] {
  return features.map((feature) => {
    const factors: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    
    // RSI analysis
    if (feature.rsi < 30) {
      bullishScore += 2;
      factors.push("RSI oversold");
    } else if (feature.rsi > 70) {
      bearishScore += 2;
      factors.push("RSI overbought");
    }
    
    // MACD analysis
    if (feature.macdHistogram > 0 && feature.macd > feature.macdSignal) {
      bullishScore += 1.5;
      factors.push("MACD bullish crossover");
    } else if (feature.macdHistogram < 0 && feature.macd < feature.macdSignal) {
      bearishScore += 1.5;
      factors.push("MACD bearish crossover");
    }
    
    // Price momentum
    if (feature.priceChange1h > 2) {
      bullishScore += 1;
      factors.push("Strong 1h momentum");
    } else if (feature.priceChange1h < -2) {
      bearishScore += 1;
      factors.push("Negative 1h momentum");
    }
    
    // Moving Average position
    if (feature.aboveMA) {
      bullishScore += 1;
      factors.push("Price above EMA");
    } else {
      bearishScore += 1;
      factors.push("Price below EMA");
    }
    
    // Volume analysis
    if (feature.volumeChange24h > 20) {
      bullishScore += 1.5;
      factors.push("Volume spike");
    }
    
    // Capital flow analysis
    if (feature.netFlowPercentage > 0.5) {
      bullishScore += 2;
      factors.push("Strong capital inflow");
    } else if (feature.netFlowPercentage < -0.5) {
      bearishScore += 2;
      factors.push("Capital outflow");
    }
    
    // Funding rate (derivative markets)
    if (feature.fundingRate < -0.05) {
      bullishScore += 1;
      factors.push("Negative funding rate");
    } else if (feature.fundingRate > 0.05) {
      bearishScore += 1;
      factors.push("Positive funding rate");
    }
    
    // On-chain flow
    if (feature.exchangeOutflow > feature.exchangeInflow * 1.5) {
      bullishScore += 1.5;
      factors.push("Exchange outflows");
    } else if (feature.exchangeInflow > feature.exchangeOutflow * 1.5) {
      bearishScore += 1.5;
      factors.push("Exchange inflows");
    }
    
    // Calculate overall score and prediction
    const totalScore = bullishScore - bearishScore;
    const maxPossibleScore = 12.5; // Sum of all possible points
    
    // Calculate confidence as percentage of max possible score
    let confidence = Math.min(0.95, Math.abs(totalScore) / maxPossibleScore);
    // Apply sigmoid to make confidence distribution more realistic
    confidence = 1 / (1 + Math.exp(-5 * (confidence - 0.5))) * 0.9 + 0.05;
    
    // Keep only the top 3 most important factors
    const sortedFactors = factors
      .map(factor => ({ 
        factor, 
        importance: FEATURE_IMPORTANCE[factor.split(' ')[0].toLowerCase()] || 0.5 
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(f => f.factor);
    
    return {
      symbol: feature.symbol,
      bullish: totalScore > 0,
      confidence: parseFloat(confidence.toFixed(2)),
      factors: sortedFactors
    };
  });
}

// In a future version, this would be a real TensorFlow.js model
export async function initTensorFlowModel(): Promise<tf.LayersModel | null> {
  try {
    // Simple demo model
    const model = tf.sequential();
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [12]
    }));
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  } catch (error) {
    console.error("Error initializing TensorFlow model:", error);
    return null;
  }
}

// Store predictions in memory with timestamp to avoid frequent recalculations
const predictionCache = new Map<string, { prediction: Prediction, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function getCachedPrediction(symbol: string): Prediction | null {
  const cached = predictionCache.get(symbol);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  return isExpired ? null : cached.prediction;
}

export function storePrediction(prediction: Prediction): void {
  predictionCache.set(prediction.symbol, {
    prediction,
    timestamp: Date.now()
  });
}
