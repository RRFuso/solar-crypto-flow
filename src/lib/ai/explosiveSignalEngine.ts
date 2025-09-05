import { MarketDataPoint } from '@/lib/ai/dataAggregator';
import { OnChainMetrics } from '@/types/onchain';
import { SocialMetrics } from '@/types/social';

export interface ExplosiveFeatures {
  symbol: string;
  timestamp: number;
  
  // On-chain metrics
  activeAddresses: number;
  newWallets: number;
  whaleMovements: number;
  dormantWakeups: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  
  // Social sentiment
  socialScore: number; // -1 to 1
  mentionVolume: number;
  sentimentCluster: 'bullish' | 'bearish' | 'neutral';
  
  // Market data
  volume24h: number;
  priceChange24h: number;
  liquidityDepth: number;
  orderBookImbalance: number;
  
  // Technical indicators
  rsi: number;
  macd: number;
  bollingerPosition: number;
  volumeProfile: number;
}

export interface AnomalyScore {
  symbol: string;
  timestamp: number;
  isolationScore: number; // 0-1, higher = more anomalous
  curveShiftScore: number; // 0-1, probability of upcoming explosion
  onChainAnomaly: number;
  socialAnomaly: number;
  marketAnomaly: number;
  compositeScore: number;
}

export interface ExplosivePrediction {
  symbol: string;
  timestamp: number;
  direction: 'bullish' | 'bearish';
  confidence: number; // 0-1
  timeHorizon: '1h' | '4h' | '12h' | '24h';
  expectedMove: number; // percentage
  confidenceInterval: [number, number];
  riskLevel: 'low' | 'medium' | 'high';
  
  // Contributing factors
  primaryFactors: string[];
  anomalyContribution: number;
  modelPrediction: number;
  sentimentContribution: number;
  onChainContribution: number;
  
  // Signal classification
  signalType: '⚡ Alta probabilidade' | '✨ Moderada probabilidade' | '⁉️ Baixa probabilidade';
  recommendation: 'monitorar' | 'setup de compra' | 'aguardar' | 'evitar';
  reasoning: string;
}

export class ExplosiveSignalEngine {
  private weights = {
    anomaly: 0.3,
    model: 0.35,
    sentiment: 0.15,
    onchain: 0.2
  };

  private thresholds = {
    high: 0.8,
    moderate: 0.6,
    low: 0.4
  };

  // Isolation Forest simulation for anomaly detection
  private detectAnomalies(features: ExplosiveFeatures[]): AnomalyScore[] {
    return features.map(feature => {
      // Simulate isolation forest scoring
      const onChainAnomaly = this.calculateOnChainAnomalyScore(feature);
      const socialAnomaly = this.calculateSocialAnomalyScore(feature);
      const marketAnomaly = this.calculateMarketAnomalyScore(feature);
      
      const isolationScore = (onChainAnomaly + socialAnomaly + marketAnomaly) / 3;
      
      // Curve shifting: look for patterns that preceded explosions
      const curveShiftScore = this.calculateCurveShiftScore(feature);
      
      const compositeScore = (isolationScore * 0.6) + (curveShiftScore * 0.4);
      
      return {
        symbol: feature.symbol,
        timestamp: feature.timestamp,
        isolationScore,
        curveShiftScore,
        onChainAnomaly,
        socialAnomaly,
        marketAnomaly,
        compositeScore
      };
    });
  }

  private calculateOnChainAnomalyScore(feature: ExplosiveFeatures): number {
    let score = 0;
    
    // Whale movements spike
    if (feature.whaleMovements > 10) score += 0.3;
    
    // Dormant wallets awakening
    if (feature.dormantWakeups > 5) score += 0.25;
    
    // Exchange outflow (accumulation)
    if (feature.exchangeOutflow > feature.exchangeInflow * 2) score += 0.2;
    
    // New wallet creation spike
    if (feature.newWallets > 100) score += 0.15;
    
    // Active addresses increase
    const activeAddressRatio = feature.activeAddresses / 1000; // normalize
    if (activeAddressRatio > 1.5) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateSocialAnomalyScore(feature: ExplosiveFeatures): number {
    let score = 0;
    
    // High positive sentiment
    if (feature.socialScore > 0.7) score += 0.4;
    
    // Mention volume spike
    if (feature.mentionVolume > 1000) score += 0.3;
    
    // Bullish sentiment cluster
    if (feature.sentimentCluster === 'bullish') score += 0.3;
    
    return Math.min(score, 1);
  }

  private calculateMarketAnomalyScore(feature: ExplosiveFeatures): number {
    let score = 0;
    
    // Volume spike
    if (feature.volume24h > 2) score += 0.3; // 2x average
    
    // Order book imbalance favoring buyers
    if (feature.orderBookImbalance > 0.6) score += 0.25;
    
    // High liquidity depth
    if (feature.liquidityDepth > 1.5) score += 0.2;
    
    // Technical momentum
    if (feature.rsi > 50 && feature.rsi < 70) score += 0.15;
    if (feature.macd > 0) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateCurveShiftScore(feature: ExplosiveFeatures): number {
    // Pattern recognition for pre-explosion conditions
    let score = 0;
    
    // Volume building up before breakout
    if (feature.volumeProfile > 1.2 && feature.priceChange24h < 5) score += 0.3;
    
    // Bollinger band squeeze before expansion
    if (feature.bollingerPosition > 0.8 || feature.bollingerPosition < 0.2) score += 0.2;
    
    // Accumulation pattern (high volume, stable price)
    if (feature.volume24h > 1.5 && Math.abs(feature.priceChange24h) < 3) score += 0.3;
    
    // RSI reset from oversold
    if (feature.rsi > 35 && feature.rsi < 55) score += 0.2;
    
    return Math.min(score, 1);
  }

  // Multi-model prediction ensemble
  private generateModelPredictions(features: ExplosiveFeatures[]): Map<string, number> {
    const predictions = new Map<string, number>();
    
    features.forEach(feature => {
      // Simulate LSTM prediction
      const lstmScore = this.simulateLSTMPrediction(feature);
      
      // Simulate GRU prediction
      const gruScore = this.simulateGRUPrediction(feature);
      
      // Simulate ConvLSTM prediction
      const convLstmScore = this.simulateConvLSTMPrediction(feature);
      
      // Ensemble average with weights
      const ensembleScore = (lstmScore * 0.4) + (gruScore * 0.3) + (convLstmScore * 0.3);
      
      predictions.set(feature.symbol, ensembleScore);
    });
    
    return predictions;
  }

  private simulateLSTMPrediction(feature: ExplosiveFeatures): number {
    // Simulate LSTM focusing on sequential patterns
    let score = 0;
    
    if (feature.volume24h > 1.5) score += 0.3;
    if (feature.rsi > 40 && feature.rsi < 60) score += 0.2;
    if (feature.macd > 0) score += 0.2;
    if (feature.priceChange24h > -2 && feature.priceChange24h < 5) score += 0.3;
    
    return Math.min(score, 1);
  }

  private simulateGRUPrediction(feature: ExplosiveFeatures): number {
    // Simulate GRU focusing on recent momentum
    let score = 0;
    
    if (feature.whaleMovements > 5) score += 0.4;
    if (feature.socialScore > 0.5) score += 0.3;
    if (feature.exchangeOutflow > feature.exchangeInflow) score += 0.3;
    
    return Math.min(score, 1);
  }

  private simulateConvLSTMPrediction(feature: ExplosiveFeatures): number {
    // Simulate ConvLSTM focusing on pattern recognition
    let score = 0;
    
    if (feature.bollingerPosition > 0.7) score += 0.3;
    if (feature.volumeProfile > 1.3) score += 0.3;
    if (feature.orderBookImbalance > 0.6) score += 0.2;
    if (feature.newWallets > 50) score += 0.2;
    
    return Math.min(score, 1);
  }

  // Main processing function
  public processExplosiveSignals(features: ExplosiveFeatures[]): ExplosivePrediction[] {
    // 1. Detect anomalies
    const anomalies = this.detectAnomalies(features);
    
    // 2. Generate model predictions
    const modelPredictions = this.generateModelPredictions(features);
    
    // 3. Calculate composite scores and generate predictions
    const predictions: ExplosivePrediction[] = [];
    
    features.forEach(feature => {
      const anomaly = anomalies.find(a => a.symbol === feature.symbol);
      const modelPrediction = modelPredictions.get(feature.symbol) || 0;
      
      if (!anomaly) return;
      
      // Calculate composite score
      const compositeScore = 
        (this.weights.anomaly * anomaly.compositeScore) +
        (this.weights.model * modelPrediction) +
        (this.weights.sentiment * Math.max(0, feature.socialScore)) +
        (this.weights.onchain * this.calculateOnChainContribution(feature));
      
      // Determine confidence and classification
      const confidence = Math.min(compositeScore, 1);
      const signalType = this.classifySignal(confidence);
      const recommendation = this.generateRecommendation(confidence, feature);
      
      // Generate prediction
      const prediction: ExplosivePrediction = {
        symbol: feature.symbol,
        timestamp: feature.timestamp,
        direction: this.determineDirection(feature),
        confidence,
        timeHorizon: this.determineTimeHorizon(anomaly.curveShiftScore),
        expectedMove: this.calculateExpectedMove(confidence, feature),
        confidenceInterval: this.calculateConfidenceInterval(confidence),
        riskLevel: this.assessRiskLevel(confidence, feature),
        primaryFactors: this.identifyPrimaryFactors(feature, anomaly, modelPrediction),
        anomalyContribution: anomaly.compositeScore,
        modelPrediction,
        sentimentContribution: feature.socialScore,
        onChainContribution: this.calculateOnChainContribution(feature),
        signalType,
        recommendation,
        reasoning: this.generateReasoning(feature, anomaly, modelPrediction, confidence)
      };
      
      // Filter high-quality signals
      if (confidence > this.thresholds.low) {
        predictions.push(prediction);
      }
    });
    
    // Sort by confidence
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateOnChainContribution(feature: ExplosiveFeatures): number {
    return (feature.whaleMovements / 20 + 
            feature.dormantWakeups / 10 + 
            Math.max(0, (feature.exchangeOutflow - feature.exchangeInflow) / 100)) / 3;
  }

  private classifySignal(confidence: number): '⚡ Alta probabilidade' | '✨ Moderada probabilidade' | '⁉️ Baixa probabilidade' {
    if (confidence >= this.thresholds.high) return '⚡ Alta probabilidade';
    if (confidence >= this.thresholds.moderate) return '✨ Moderada probabilidade';
    return '⁉️ Baixa probabilidade';
  }

  private generateRecommendation(confidence: number, feature: ExplosiveFeatures): 'monitorar' | 'setup de compra' | 'aguardar' | 'evitar' {
    if (confidence >= this.thresholds.high && feature.socialScore > 0.6) return 'setup de compra';
    if (confidence >= this.thresholds.moderate) return 'monitorar';
    if (confidence >= this.thresholds.low) return 'aguardar';
    return 'evitar';
  }

  private determineDirection(feature: ExplosiveFeatures): 'bullish' | 'bearish' {
    const bullishScore = 
      (feature.socialScore > 0 ? 1 : 0) +
      (feature.exchangeOutflow > feature.exchangeInflow ? 1 : 0) +
      (feature.whaleMovements > 5 ? 1 : 0) +
      (feature.rsi > 50 ? 1 : 0);
    
    return bullishScore >= 2 ? 'bullish' : 'bearish';
  }

  private determineTimeHorizon(curveShiftScore: number): '1h' | '4h' | '12h' | '24h' {
    if (curveShiftScore > 0.8) return '1h';
    if (curveShiftScore > 0.6) return '4h';
    if (curveShiftScore > 0.4) return '12h';
    return '24h';
  }

  private calculateExpectedMove(confidence: number, feature: ExplosiveFeatures): number {
    // Base move calculation with low-cap altcoin potential boost
    const baseMove = confidence * 20; // Increased base for altseason
    const volumeMultiplier = Math.min(feature.volume24h / 2, 3); // Increased max multiplier
    
    // Low market cap coins get higher expected moves during altseason
    const lowCapBonus = feature.symbol.length > 0 ? 1.5 : 1; // Simplified low cap detection
    
    return baseMove * volumeMultiplier * lowCapBonus;
  }

  private calculateConfidenceInterval(confidence: number): [number, number] {
    const margin = (1 - confidence) * 10; // Larger margin for lower confidence
    return [confidence - margin, Math.min(confidence + margin, 1)];
  }

  private assessRiskLevel(confidence: number, feature: ExplosiveFeatures): 'low' | 'medium' | 'high' {
    if (confidence > 0.8 && feature.liquidityDepth > 1.5) return 'low';
    if (confidence > 0.6) return 'medium';
    return 'high';
  }

  private identifyPrimaryFactors(feature: ExplosiveFeatures, anomaly: AnomalyScore, modelPrediction: number): string[] {
    const factors: string[] = [];
    
    if (anomaly.onChainAnomaly > 0.7) factors.push('On-chain whale activity');
    if (feature.socialScore > 0.6) factors.push('Positive sentiment surge');
    if (modelPrediction > 0.7) factors.push('ML model prediction');
    if (feature.volume24h > 2) factors.push('Volume explosion');
    if (feature.exchangeOutflow > feature.exchangeInflow * 1.5) factors.push('Exchange outflow');
    if (feature.dormantWakeups > 5) factors.push('Dormant wallet activation');
    
    return factors.slice(0, 3); // Top 3 factors
  }

  private generateReasoning(feature: ExplosiveFeatures, anomaly: AnomalyScore, modelPrediction: number, confidence: number): string {
    const reasons: string[] = [];
    
    if (anomaly.onChainAnomaly > 0.7) reasons.push('Spike de whales');
    if (feature.socialScore > 0.6) reasons.push('sentimento positivo');
    if (modelPrediction > 0.7) reasons.push(`previsão de ML >${Math.round(modelPrediction * 100)}%`);
    if (feature.volume24h > 2) reasons.push('volume explosivo');
    
    return reasons.join(' + ') + `. Confiança: ${Math.round(confidence * 100)}%`;
  }
}

export const explosiveSignalEngine = new ExplosiveSignalEngine();