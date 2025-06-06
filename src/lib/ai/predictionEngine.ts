
import { AdvancedFeatures } from './featureEngine';

export type PredictionHorizon = '1h' | '4h' | '1d' | '3d' | '1w' | '1m';
export type PredictionDirection = 'bullish' | 'bearish' | 'neutral';

export interface MarketPrediction {
  symbol: string;
  timestamp: number;
  horizon: PredictionHorizon;
  direction: PredictionDirection;
  confidence: number; // 0-100
  expectedMove: number; // Expected percentage move
  probabilityUp: number; // 0-100
  probabilityDown: number; // 0-100
  probabilityNeutral: number; // 0-100
  
  // Risk metrics
  maxDrawdown: number;
  volatilityForecast: number;
  
  // Entry/exit suggestions
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  
  // Reasoning
  keyFactors: string[];
  riskFactors: string[];
  bullishFactors: string[];
  bearishFactors: string[];
  
  // Model metrics
  modelConfidence: number;
  historicalAccuracy: number;
}

export interface PatternDetection {
  pattern: string;
  confidence: number;
  implication: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export class PredictionEngine {
  private modelWeights = {
    technical: 0.4,
    volume: 0.2,
    momentum: 0.15,
    onChain: 0.1,
    social: 0.1,
    crossAsset: 0.05
  };

  private horizonWeights = {
    '1h': { technical: 0.6, volume: 0.3, momentum: 0.1 },
    '4h': { technical: 0.5, volume: 0.25, momentum: 0.15, onChain: 0.05, social: 0.05 },
    '1d': { technical: 0.4, volume: 0.2, momentum: 0.2, onChain: 0.1, social: 0.1 },
    '3d': { technical: 0.3, volume: 0.15, momentum: 0.25, onChain: 0.15, social: 0.15 },
    '1w': { technical: 0.25, volume: 0.1, momentum: 0.3, onChain: 0.2, social: 0.15 },
    '1m': { technical: 0.2, volume: 0.1, momentum: 0.3, onChain: 0.25, social: 0.15 }
  };

  generatePredictions(
    features: AdvancedFeatures[],
    currentPrice: number,
    horizons: PredictionHorizon[] = ['1h', '4h', '1d', '3d', '1w']
  ): MarketPrediction[] {
    if (features.length === 0) return [];

    const latestFeatures = features[features.length - 1];
    const predictions: MarketPrediction[] = [];

    for (const horizon of horizons) {
      const prediction = this.generateSinglePrediction(latestFeatures, currentPrice, horizon, features);
      predictions.push(prediction);
    }

    return predictions;
  }

  private generateSinglePrediction(
    features: AdvancedFeatures,
    currentPrice: number,
    horizon: PredictionHorizon,
    historicalFeatures: AdvancedFeatures[]
  ): MarketPrediction {
    // Calculate component scores
    const technicalScore = this.calculateTechnicalScore(features);
    const volumeScore = this.calculateVolumeScore(features);
    const momentumScore = this.calculateMomentumScore(features);
    const onChainScore = this.calculateOnChainScore(features);
    const socialScore = this.calculateSocialScore(features);
    const crossAssetScore = this.calculateCrossAssetScore(features);

    // Apply horizon-specific weights
    const weights = this.horizonWeights[horizon];
    const compositeScore = 
      (technicalScore * (weights.technical || 0)) +
      (volumeScore * (weights.volume || 0)) +
      (momentumScore * (weights.momentum || 0)) +
      (onChainScore * (weights.onChain || 0)) +
      (socialScore * (weights.social || 0)) +
      (crossAssetScore * (weights.crossAsset || 0));

    // Convert to probabilities
    const { probabilityUp, probabilityDown, probabilityNeutral } = this.calculateProbabilities(compositeScore, features);
    
    // Determine direction and confidence
    const direction = this.determineDirection(probabilityUp, probabilityDown, probabilityNeutral);
    const confidence = this.calculateConfidence(probabilityUp, probabilityDown, probabilityNeutral, features);

    // Calculate expected move
    const expectedMove = this.calculateExpectedMove(compositeScore, features, horizon);

    // Generate entry/exit levels
    const { entryPrice, stopLoss, takeProfit1, takeProfit2 } = this.calculateTradingLevels(
      currentPrice, expectedMove, direction, features
    );

    // Extract reasoning
    const { keyFactors, riskFactors, bullishFactors, bearishFactors } = this.extractReasoningFactors(features);

    // Calculate risk metrics
    const maxDrawdown = this.calculateMaxDrawdown(features, horizon);
    const volatilityForecast = this.forecastVolatility(features, horizon);

    // Model performance metrics
    const modelConfidence = this.calculateModelConfidence(features, historicalFeatures);
    const historicalAccuracy = this.calculateHistoricalAccuracy(horizon);

    return {
      symbol: features.symbol,
      timestamp: Date.now(),
      horizon,
      direction,
      confidence,
      expectedMove,
      probabilityUp,
      probabilityDown,
      probabilityNeutral,
      maxDrawdown,
      volatilityForecast,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      keyFactors,
      riskFactors,
      bullishFactors,
      bearishFactors,
      modelConfidence,
      historicalAccuracy
    };
  }

  private calculateTechnicalScore(features: AdvancedFeatures): number {
    let score = 50; // Neutral base

    // RSI divergence
    score += features.rsiDivergence * 20;

    // MACD crossover
    score += features.macdCrossover * 15;

    // EMA alignment
    score += features.emaAlignment * 20;

    // Bollinger band position
    if (features.bollinger_position > 0.8) score += 10; // Near upper band
    if (features.bollinger_position < 0.2) score -= 10; // Near lower band

    // Trend strength
    score += (features.trendStrength - 50) * 0.3;

    // Support/resistance
    score += (features.supportResistanceStrength - 50) * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  private calculateVolumeScore(features: AdvancedFeatures): number {
    let score = 50;

    // Volume breakout
    score += Math.min(25, (features.volumeBreakout - 1) * 25);

    // Volume-price correlation
    score += features.volumePriceCorrelation * 15;

    // Accumulation/Distribution
    score += Math.tanh(features.accumulationDistribution / 1000000) * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateMomentumScore(features: AdvancedFeatures): number {
    let score = features.momentumScore;

    // Price acceleration
    score += features.priceAcceleration * 1000; // Scale appropriately

    // Trend strength adjustment
    score += (features.trendStrength - 50) * 0.5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateOnChainScore(features: AdvancedFeatures): number {
    let score = 50;

    // Network growth momentum
    score += (features.networkGrowthMomentum - 50) * 0.5;

    // Whale activity
    score += (features.whaleActivity - 50) * 0.3;

    // Exchange flow signal
    score += (features.exchangeFlowSignal - 50) * 0.4;

    return Math.max(0, Math.min(100, score));
  }

  private calculateSocialScore(features: AdvancedFeatures): number {
    let score = 50;

    // Social momentum
    score += (features.socialMomentum - 50) * 0.4;

    // Sentiment shift
    score += features.sentimentShift * 20;

    // Attention spike bonus
    if (features.attentionSpike) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateCrossAssetScore(features: AdvancedFeatures): number {
    let score = 50;

    // BTC correlation consideration
    score += features.btcCorrelation * 10;

    // Relative strength
    score += features.relativeStrength * 100;

    // Market beta adjustment
    score += (1 - Math.abs(features.marketBeta - 1)) * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateProbabilities(compositeScore: number, features: AdvancedFeatures): {
    probabilityUp: number;
    probabilityDown: number;
    probabilityNeutral: number;
  } {
    // Base probabilities from composite score
    let probUp = Math.max(0, Math.min(100, compositeScore));
    let probDown = 100 - probUp;

    // Adjust for volatility (high volatility increases extreme outcomes)
    const volatilityMultiplier = features.volatilityRegime === 'extreme' ? 1.3 : 
                                features.volatilityRegime === 'high' ? 1.1 : 1;

    // Adjust for consolidation (increases neutral probability)
    const neutralAdjustment = features.consolidationPhase ? 20 : 0;

    // Apply adjustments
    probUp *= volatilityMultiplier;
    probDown *= volatilityMultiplier;

    const total = probUp + probDown + neutralAdjustment;
    
    return {
      probabilityUp: (probUp / total) * 100,
      probabilityDown: (probDown / total) * 100,
      probabilityNeutral: (neutralAdjustment / total) * 100
    };
  }

  private determineDirection(probUp: number, probDown: number, probNeutral: number): PredictionDirection {
    const maxProb = Math.max(probUp, probDown, probNeutral);
    
    if (maxProb === probUp && probUp > 40) return 'bullish';
    if (maxProb === probDown && probDown > 40) return 'bearish';
    return 'neutral';
  }

  private calculateConfidence(
    probUp: number, 
    probDown: number, 
    probNeutral: number, 
    features: AdvancedFeatures
  ): number {
    // Base confidence from probability spread
    const maxProb = Math.max(probUp, probDown, probNeutral);
    let confidence = (maxProb - 33.33) * 1.5; // Scale from 33.33-100 to 0-100

    // Adjust for risk factors
    if (features.volatilityRegime === 'extreme') confidence *= 0.8;
    if (features.consolidationPhase) confidence *= 0.7;
    if (features.explosivePotential > 70) confidence *= 1.2;

    return Math.max(0, Math.min(100, confidence));
  }

  private calculateExpectedMove(
    compositeScore: number, 
    features: AdvancedFeatures, 
    horizon: PredictionHorizon
  ): number {
    // Base move from composite score
    let baseMove = (compositeScore - 50) * 0.2; // -10% to +10% for extreme scores

    // Adjust for volatility
    const volMultiplier = features.volatilityRegime === 'extreme' ? 2 : 
                         features.volatilityRegime === 'high' ? 1.5 : 1;

    // Adjust for explosive potential
    const explosiveMultiplier = 1 + (features.explosivePotential / 100);

    // Adjust for time horizon
    const timeMultipliers = {
      '1h': 0.2,
      '4h': 0.5,
      '1d': 1,
      '3d': 2,
      '1w': 3.5,
      '1m': 8
    };

    return baseMove * volMultiplier * explosiveMultiplier * timeMultipliers[horizon];
  }

  private calculateTradingLevels(
    currentPrice: number,
    expectedMove: number,
    direction: PredictionDirection,
    features: AdvancedFeatures
  ): {
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
  } {
    const entryPrice = currentPrice;
    
    if (direction === 'bullish') {
      const stopLoss = currentPrice * (1 - 0.03 - features.riskScore / 1000); // 3% + risk adjustment
      const takeProfit1 = currentPrice * (1 + Math.abs(expectedMove) * 0.6);
      const takeProfit2 = currentPrice * (1 + Math.abs(expectedMove) * 1.2);
      
      return { entryPrice, stopLoss, takeProfit1, takeProfit2 };
    } else if (direction === 'bearish') {
      const stopLoss = currentPrice * (1 + 0.03 + features.riskScore / 1000);
      const takeProfit1 = currentPrice * (1 + expectedMove * 0.6); // expectedMove is negative
      const takeProfit2 = currentPrice * (1 + expectedMove * 1.2);
      
      return { entryPrice, stopLoss, takeProfit1, takeProfit2 };
    } else {
      // Neutral - tight range
      return {
        entryPrice,
        stopLoss: currentPrice * 0.98,
        takeProfit1: currentPrice * 1.01,
        takeProfit2: currentPrice * 1.02
      };
    }
  }

  private extractReasoningFactors(features: AdvancedFeatures): {
    keyFactors: string[];
    riskFactors: string[];
    bullishFactors: string[];
    bearishFactors: string[];
  } {
    const keyFactors: string[] = [];
    const riskFactors: string[] = [];
    const bullishFactors: string[] = [];
    const bearishFactors: string[] = [];

    // Technical factors
    if (Math.abs(features.rsiDivergence) > 0.3) {
      const factor = `RSI ${features.rsiDivergence > 0 ? 'bullish' : 'bearish'} divergence`;
      keyFactors.push(factor);
      if (features.rsiDivergence > 0) bullishFactors.push(factor);
      else bearishFactors.push(factor);
    }

    if (Math.abs(features.macdCrossover) > 0.5) {
      const factor = `MACD ${features.macdCrossover > 0 ? 'bullish' : 'bearish'} crossover`;
      keyFactors.push(factor);
      if (features.macdCrossover > 0) bullishFactors.push(factor);
      else bearishFactors.push(factor);
    }

    if (Math.abs(features.emaAlignment) > 0.7) {
      const factor = `Strong EMA ${features.emaAlignment > 0 ? 'bullish' : 'bearish'} alignment`;
      keyFactors.push(factor);
      if (features.emaAlignment > 0) bullishFactors.push(factor);
      else bearishFactors.push(factor);
    }

    // Volume factors
    if (features.volumeBreakout > 1.5) {
      keyFactors.push('Volume breakout detected');
      bullishFactors.push('High volume surge');
    }

    // Risk factors
    if (features.volatilityRegime === 'extreme') {
      riskFactors.push('Extreme volatility environment');
    }

    if (features.riskScore > 70) {
      riskFactors.push('High risk market conditions');
    }

    if (features.supportResistanceStrength < 30) {
      riskFactors.push('Weak support/resistance levels');
    }

    // Social factors
    if (features.attentionSpike) {
      keyFactors.push('Social media attention spike');
      bullishFactors.push('Increased market attention');
    }

    if (features.sentimentShift > 0.3) {
      bullishFactors.push('Positive sentiment shift');
    } else if (features.sentimentShift < -0.3) {
      bearishFactors.push('Negative sentiment shift');
    }

    // On-chain factors
    if (features.networkGrowthMomentum > 70) {
      bullishFactors.push('Strong network growth');
    }

    if (features.whaleActivity > 70) {
      keyFactors.push('High whale activity detected');
    }

    return { keyFactors, riskFactors, bullishFactors, bearishFactors };
  }

  private calculateMaxDrawdown(features: AdvancedFeatures, horizon: PredictionHorizon): number {
    // Estimate maximum potential drawdown based on volatility and risk factors
    let baseDrawdown = 0.05; // 5% base

    // Adjust for volatility
    const volMultiplier = features.volatilityRegime === 'extreme' ? 3 : 
                         features.volatilityRegime === 'high' ? 2 : 1;

    // Adjust for time horizon
    const timeMultipliers = {
      '1h': 0.3,
      '4h': 0.6,
      '1d': 1,
      '3d': 1.5,
      '1w': 2,
      '1m': 3
    };

    // Adjust for risk score
    const riskMultiplier = 1 + (features.riskScore / 100);

    return baseDrawdown * volMultiplier * timeMultipliers[horizon] * riskMultiplier;
  }

  private forecastVolatility(features: AdvancedFeatures, horizon: PredictionHorizon): number {
    // Current volatility trend
    let forecastVol = features.volatilityTrend;

    // Adjust for current regime
    if (features.volatilityRegime === 'extreme') forecastVol += 0.02;
    if (features.volatilityRegime === 'high') forecastVol += 0.01;

    // Adjust for explosive potential
    forecastVol += (features.explosivePotential / 100) * 0.01;

    // Time decay adjustment
    const timeAdjustments = {
      '1h': 1,
      '4h': 0.9,
      '1d': 0.8,
      '3d': 0.7,
      '1w': 0.6,
      '1m': 0.5
    };

    return Math.max(0, forecastVol * timeAdjustments[horizon]);
  }

  private calculateModelConfidence(
    features: AdvancedFeatures, 
    historicalFeatures: AdvancedFeatures[]
  ): number {
    // Base confidence from data quality
    let confidence = 70; // Base confidence

    // Adjust for data consistency
    if (historicalFeatures.length > 50) confidence += 10;
    if (historicalFeatures.length > 100) confidence += 10;

    // Adjust for signal clarity
    if (features.bullishScore > 70 || features.bearishScore > 70) confidence += 10;
    if (features.explosivePotential > 70) confidence += 5;

    // Reduce confidence in uncertain conditions
    if (features.volatilityRegime === 'extreme') confidence -= 15;
    if (features.consolidationPhase) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }

  private calculateHistoricalAccuracy(horizon: PredictionHorizon): number {
    // Placeholder for historical accuracy tracking
    // In production, this would be calculated from backtesting results
    const baseAccuracy = {
      '1h': 65,
      '4h': 68,
      '1d': 70,
      '3d': 67,
      '1w': 63,
      '1m': 58
    };

    return baseAccuracy[horizon];
  }

  detectPatterns(features: AdvancedFeatures[]): PatternDetection[] {
    if (features.length < 20) return [];

    const patterns: PatternDetection[] = [];

    // Volume spike with price breakout
    const latest = features[features.length - 1];
    if (latest.volumeBreakout > 2 && latest.bollinger_position > 0.8) {
      patterns.push({
        pattern: 'Volume Breakout',
        confidence: 85,
        implication: 'bullish',
        description: 'Strong volume surge with price breaking above Bollinger upper band'
      });
    }

    // RSI divergence pattern
    if (Math.abs(latest.rsiDivergence) > 0.5) {
      patterns.push({
        pattern: 'RSI Divergence',
        confidence: 75,
        implication: latest.rsiDivergence > 0 ? 'bullish' : 'bearish',
        description: `${latest.rsiDivergence > 0 ? 'Bullish' : 'Bearish'} divergence between price and RSI`
      });
    }

    // Trend alignment pattern
    if (Math.abs(latest.emaAlignment) > 0.8) {
      patterns.push({
        pattern: 'EMA Alignment',
        confidence: 80,
        implication: latest.emaAlignment > 0 ? 'bullish' : 'bearish',
        description: `Strong ${latest.emaAlignment > 0 ? 'bullish' : 'bearish'} trend with aligned EMAs`
      });
    }

    // Consolidation breakout setup
    if (latest.consolidationPhase && latest.volumeBreakout > 1.3) {
      patterns.push({
        pattern: 'Consolidation Breakout',
        confidence: 70,
        implication: 'bullish',
        description: 'Price breaking out of consolidation phase with volume confirmation'
      });
    }

    return patterns;
  }
}

export const predictionEngine = new PredictionEngine();
