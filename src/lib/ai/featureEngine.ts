
import { MarketDataPoint, OnChainMetrics, SocialMetrics } from './dataAggregator';

export interface AdvancedFeatures {
  symbol: string;
  timestamp: number;
  
  // Price momentum features
  priceAcceleration: number;
  priceVelocity: number;
  momentumScore: number;
  
  // Technical analysis features
  rsiDivergence: number; // -1 to 1, bearish to bullish divergence
  macdCrossover: number; // Recent crossover strength
  bollinger_position: number; // 0-1, position within bands
  emaAlignment: number; // Trend strength based on EMA alignment
  
  // Volume analysis
  volumePriceCorrelation: number;
  volumeBreakout: number;
  accumulationDistribution: number;
  
  // Volatility features
  volatilityRegime: 'low' | 'normal' | 'high' | 'extreme';
  volatilityTrend: number; // Increasing or decreasing volatility
  
  // Market structure
  supportResistanceStrength: number;
  trendStrength: number;
  consolidationPhase: boolean;
  
  // Cross-asset features
  btcCorrelation: number;
  marketBeta: number;
  relativeStrength: number;
  
  // On-chain features (if available)
  networkGrowthMomentum: number;
  whaleActivity: number;
  exchangeFlowSignal: number;
  
  // Social features (if available)
  socialMomentum: number;
  sentimentShift: number;
  attentionSpike: boolean;
  
  // Composite scores
  bullishScore: number; // 0-100
  bearishScore: number; // 0-100
  explosivePotential: number; // 0-100
  riskScore: number; // 0-100
}

export class FeatureEngine {
  private historyLength = 100; // Number of periods to look back for feature calculation

  generateAdvancedFeatures(
    marketData: MarketDataPoint[],
    onChainData: OnChainMetrics[] = [],
    socialData: SocialMetrics[] = [],
    btcData: MarketDataPoint[] = []
  ): AdvancedFeatures[] {
    if (marketData.length < 20) return []; // Need minimum data for meaningful features

    const features: AdvancedFeatures[] = [];
    
    for (let i = 20; i < marketData.length; i++) {
      const current = marketData[i];
      const windowData = marketData.slice(Math.max(0, i - 20), i + 1);
      
      // Price momentum features
      const priceAcceleration = this.calculatePriceAcceleration(windowData);
      const priceVelocity = this.calculatePriceVelocity(windowData);
      const momentumScore = this.calculateMomentumScore(windowData);
      
      // Technical analysis features
      const rsiDivergence = this.calculateRSIDivergence(windowData);
      const macdCrossover = this.calculateMACDCrossover(windowData);
      const bollinger_position = this.calculateBollingerPosition(current);
      const emaAlignment = this.calculateEMAAlignment(current);
      
      // Volume analysis
      const volumePriceCorrelation = this.calculateVolumePriceCorrelation(windowData);
      const volumeBreakout = this.calculateVolumeBreakout(windowData);
      const accumulationDistribution = this.calculateAccumulationDistribution(windowData);
      
      // Volatility features
      const volatilityRegime = this.determineVolatilityRegime(windowData);
      const volatilityTrend = this.calculateVolatilityTrend(windowData);
      
      // Market structure
      const supportResistanceStrength = this.calculateSupportResistanceStrength(windowData);
      const trendStrength = this.calculateTrendStrength(windowData);
      const consolidationPhase = this.detectConsolidationPhase(windowData);
      
      // Cross-asset features
      const btcCorrelation = btcData.length > 0 ? this.calculateBTCCorrelation(windowData, btcData.slice(Math.max(0, i - 20), i + 1)) : 0;
      const marketBeta = this.calculateMarketBeta(windowData, btcData.slice(Math.max(0, i - 20), i + 1));
      const relativeStrength = this.calculateRelativeStrength(windowData, btcData.slice(Math.max(0, i - 20), i + 1));
      
      // On-chain features
      const networkGrowthMomentum = onChainData.length > 0 ? this.calculateNetworkGrowthMomentum(onChainData) : 50;
      const whaleActivity = onChainData.length > 0 ? this.calculateWhaleActivity(onChainData) : 50;
      const exchangeFlowSignal = onChainData.length > 0 ? this.calculateExchangeFlowSignal(onChainData) : 50;
      
      // Social features
      const socialMomentum = socialData.length > 0 ? this.calculateSocialMomentum(socialData) : 50;
      const sentimentShift = socialData.length > 0 ? this.calculateSentimentShift(socialData) : 0;
      const attentionSpike = socialData.length > 0 ? this.detectAttentionSpike(socialData) : false;
      
      // Composite scores
      const bullishScore = this.calculateBullishScore({
        rsiDivergence, macdCrossover, emaAlignment, volumeBreakout,
        momentumScore, socialMomentum, networkGrowthMomentum
      });
      
      const bearishScore = this.calculateBearishScore({
        rsiDivergence, macdCrossover, emaAlignment, volumeBreakout,
        momentumScore, socialMomentum
      });
      
      const explosivePotential = this.calculateExplosivePotential({
        volumeBreakout, volatilityRegime, bollinger_position, attentionSpike,
        whaleActivity, exchangeFlowSignal
      });
      
      const riskScore = this.calculateRiskScore({
        volatilityRegime, consolidationPhase, volumePriceCorrelation,
        supportResistanceStrength, marketBeta
      });

      features.push({
        symbol: current.symbol,
        timestamp: current.timestamp,
        priceAcceleration,
        priceVelocity,
        momentumScore,
        rsiDivergence,
        macdCrossover,
        bollinger_position,
        emaAlignment,
        volumePriceCorrelation,
        volumeBreakout,
        accumulationDistribution,
        volatilityRegime,
        volatilityTrend,
        supportResistanceStrength,
        trendStrength,
        consolidationPhase,
        btcCorrelation,
        marketBeta,
        relativeStrength,
        networkGrowthMomentum,
        whaleActivity,
        exchangeFlowSignal,
        socialMomentum,
        sentimentShift,
        attentionSpike,
        bullishScore,
        bearishScore,
        explosivePotential,
        riskScore
      });
    }

    return features;
  }

  private calculatePriceAcceleration(data: MarketDataPoint[]): number {
    if (data.length < 3) return 0;
    const recent = data.slice(-3);
    const velocity1 = (recent[1].price - recent[0].price) / recent[0].price;
    const velocity2 = (recent[2].price - recent[1].price) / recent[1].price;
    return velocity2 - velocity1;
  }

  private calculatePriceVelocity(data: MarketDataPoint[]): number {
    if (data.length < 2) return 0;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    return (last.price - prev.price) / prev.price;
  }

  private calculateMomentumScore(data: MarketDataPoint[]): number {
    if (data.length < 10) return 50;
    const recent = data.slice(-10);
    const older = data.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.price, 0) / older.length;
    
    return Math.min(100, Math.max(0, ((recentAvg - olderAvg) / olderAvg) * 500 + 50));
  }

  private calculateRSIDivergence(data: MarketDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const prices = data.map(d => d.price);
    const rsiValues = data.map(d => d.rsi);
    
    // Simple divergence detection: price trend vs RSI trend
    const priceSlope = this.calculateSlope(prices.slice(-5));
    const rsiSlope = this.calculateSlope(rsiValues.slice(-5));
    
    // Normalize to -1 to 1
    return Math.sign(priceSlope) !== Math.sign(rsiSlope) ? (rsiSlope - priceSlope) / 2 : 0;
  }

  private calculateMACDCrossover(data: MarketDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const currentCross = current.macd.value - current.macd.signal;
    const previousCross = previous.macd.value - previous.macd.signal;
    
    // Detect crossover strength
    if (previousCross <= 0 && currentCross > 0) return 1; // Bullish crossover
    if (previousCross >= 0 && currentCross < 0) return -1; // Bearish crossover
    
    return Math.tanh(currentCross * 10); // Normalize existing separation
  }

  private calculateBollingerPosition(data: MarketDataPoint): number {
    const { upper, lower } = data.bollingerBands;
    const price = data.price;
    
    if (upper === lower) return 0.5;
    return (price - lower) / (upper - lower);
  }

  private calculateEMAAlignment(data: MarketDataPoint): number {
    const { ema9, ema21, ema50, price } = data;
    
    // Check if EMAs are aligned in trending direction
    const bullishAlignment = price > ema9 && ema9 > ema21 && ema21 > ema50;
    const bearishAlignment = price < ema9 && ema9 < ema21 && ema21 < ema50;
    
    if (bullishAlignment) return 1;
    if (bearishAlignment) return -1;
    
    // Partial alignment score
    let score = 0;
    if (price > ema9) score += 0.25;
    if (ema9 > ema21) score += 0.25;
    if (ema21 > ema50) score += 0.25;
    
    return score * 2 - 1; // Normalize to -1 to 1
  }

  private calculateVolumePriceCorrelation(data: MarketDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);
    
    return this.calculateCorrelation(prices, volumes);
  }

  private calculateVolumeBreakout(data: MarketDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const current = data[data.length - 1];
    const avgVolume = data.slice(-10).reduce((sum, d) => sum + d.volume, 0) / 10;
    
    return Math.min(3, current.volume / avgVolume);
  }

  private calculateAccumulationDistribution(data: MarketDataPoint[]): number {
    // Simplified A/D calculation
    let ad = 0;
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const clv = ((current.price - current.price * 0.99) - (current.price * 1.01 - current.price)) / 
                   (current.price * 1.01 - current.price * 0.99);
      ad += clv * current.volume;
    }
    return ad;
  }

  private determineVolatilityRegime(data: MarketDataPoint[]): 'low' | 'normal' | 'high' | 'extreme' {
    const avgVolatility = data.reduce((sum, d) => sum + d.volatility24h, 0) / data.length;
    
    if (avgVolatility < 0.02) return 'low';
    if (avgVolatility < 0.05) return 'normal';
    if (avgVolatility < 0.1) return 'high';
    return 'extreme';
  }

  private calculateVolatilityTrend(data: MarketDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const recentVol = data.slice(-5).reduce((sum, d) => sum + d.volatility24h, 0) / 5;
    const olderVol = data.slice(-10, -5).reduce((sum, d) => sum + d.volatility24h, 0) / 5;
    
    return (recentVol - olderVol) / olderVol;
  }

  private calculateSupportResistanceStrength(data: MarketDataPoint[]): number {
    // Simplified support/resistance calculation
    const prices = data.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    
    // Find nearby price levels that price has tested multiple times
    const tolerance = currentPrice * 0.02; // 2% tolerance
    let touches = 0;
    
    for (const price of prices) {
      if (Math.abs(price - currentPrice) <= tolerance) {
        touches++;
      }
    }
    
    return Math.min(100, touches * 10);
  }

  private calculateTrendStrength(data: MarketDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const prices = data.map(d => d.price);
    const slope = this.calculateSlope(prices);
    const r2 = this.calculateR2(prices);
    
    return Math.abs(slope) * r2 * 100;
  }

  private detectConsolidationPhase(data: MarketDataPoint[]): boolean {
    if (data.length < 10) return false;
    
    const prices = data.map(d => d.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = (max - min) / min;
    
    return range < 0.05; // Less than 5% range indicates consolidation
  }

  private calculateBTCCorrelation(assetData: MarketDataPoint[], btcData: MarketDataPoint[]): number {
    if (assetData.length !== btcData.length || assetData.length < 10) return 0;
    
    const assetReturns = this.calculateReturns(assetData.map(d => d.price));
    const btcReturns = this.calculateReturns(btcData.map(d => d.price));
    
    return this.calculateCorrelation(assetReturns, btcReturns);
  }

  private calculateMarketBeta(assetData: MarketDataPoint[], btcData: MarketDataPoint[]): number {
    if (assetData.length !== btcData.length || assetData.length < 10) return 1;
    
    const assetReturns = this.calculateReturns(assetData.map(d => d.price));
    const btcReturns = this.calculateReturns(btcData.map(d => d.price));
    
    const covariance = this.calculateCovariance(assetReturns, btcReturns);
    const btcVariance = this.calculateVariance(btcReturns);
    
    return btcVariance !== 0 ? covariance / btcVariance : 1;
  }

  private calculateRelativeStrength(assetData: MarketDataPoint[], btcData: MarketDataPoint[]): number {
    if (assetData.length === 0 || btcData.length === 0) return 0;
    
    const assetReturn = (assetData[assetData.length - 1].price - assetData[0].price) / assetData[0].price;
    const btcReturn = (btcData[btcData.length - 1].price - btcData[0].price) / btcData[0].price;
    
    return assetReturn - btcReturn;
  }

  // On-chain feature calculations (simplified)
  private calculateNetworkGrowthMomentum(onChainData: OnChainMetrics[]): number {
    if (onChainData.length === 0) return 50;
    const latest = onChainData[onChainData.length - 1];
    return Math.min(100, Math.max(0, latest.networkGrowth * 10 + 50));
  }

  private calculateWhaleActivity(onChainData: OnChainMetrics[]): number {
    if (onChainData.length === 0) return 50;
    const latest = onChainData[onChainData.length - 1];
    return latest.concentrationByLargeHolders;
  }

  private calculateExchangeFlowSignal(onChainData: OnChainMetrics[]): number {
    if (onChainData.length === 0) return 50;
    const latest = onChainData[onChainData.length - 1];
    // > 1 means more outflow (potentially bullish), < 1 means more inflow (potentially bearish)
    return Math.min(100, Math.max(0, (latest.exchangeInflowOutflowRatio - 0.5) * 100 + 50));
  }

  // Social feature calculations (simplified)
  private calculateSocialMomentum(socialData: SocialMetrics[]): number {
    if (socialData.length === 0) return 50;
    const latest = socialData[socialData.length - 1];
    return (latest.googleTrendsScore + latest.influencerScore) / 2;
  }

  private calculateSentimentShift(socialData: SocialMetrics[]): number {
    if (socialData.length < 2) return 0;
    const latest = socialData[socialData.length - 1];
    const previous = socialData[socialData.length - 2];
    return latest.sentimentScore - previous.sentimentScore;
  }

  private detectAttentionSpike(socialData: SocialMetrics[]): boolean {
    if (socialData.length < 2) return false;
    const latest = socialData[socialData.length - 1];
    const previous = socialData[socialData.length - 2];
    
    const mentionsIncrease = (latest.twitterMentions + latest.redditMentions) / 
                            (previous.twitterMentions + previous.redditMentions);
    
    return mentionsIncrease > 1.5; // 50% increase in mentions
  }

  // Composite score calculations
  private calculateBullishScore(factors: ScoreFactors): number {
    const weights = {
      rsiDivergence: 15,
      macdCrossover: 20,
      emaAlignment: 25,
      volumeBreakout: 20,
      momentumScore: 10,
      socialMomentum: 5,
      networkGrowthMomentum: 5
    };

    let score = 0;
    score += Math.max(0, factors.rsiDivergence) * weights.rsiDivergence;
    score += Math.max(0, factors.macdCrossover) * weights.macdCrossover;
    score += Math.max(0, factors.emaAlignment) * weights.emaAlignment;
    score += Math.min(1, factors.volumeBreakout / 2) * weights.volumeBreakout;
    score += (factors.momentumScore / 100) * weights.momentumScore;
    score += (factors.socialMomentum / 100) * weights.socialMomentum;
    score += (factors.networkGrowthMomentum / 100) * weights.networkGrowthMomentum;

    return Math.min(100, score);
  }

  private calculateBearishScore(factors: any): number {
    const weights = {
      rsiDivergence: 15,
      macdCrossover: 20,
      emaAlignment: 25,
      volumeBreakout: 10,
      momentumScore: 20,
      socialMomentum: 10
    };

    let score = 0;
    score += Math.max(0, -factors.rsiDivergence) * weights.rsiDivergence;
    score += Math.max(0, -factors.macdCrossover) * weights.macdCrossover;
    score += Math.max(0, -factors.emaAlignment) * weights.emaAlignment;
    score += Math.min(1, factors.volumeBreakout / 2) * weights.volumeBreakout;
    score += ((100 - factors.momentumScore) / 100) * weights.momentumScore;
    score += ((100 - factors.socialMomentum) / 100) * weights.socialMomentum;

    return Math.min(100, score);
  }

  private calculateExplosivePotential(factors: any): number {
    let score = 0;
    
    // Volume breakout is key for explosive moves
    score += Math.min(40, factors.volumeBreakout * 15);
    
    // High volatility regime
    score += factors.volatilityRegime === 'high' ? 20 : factors.volatilityRegime === 'extreme' ? 30 : 0;
    
    // Bollinger band position (squeezing or breaking)
    const bbScore = factors.bollinger_position > 0.9 || factors.bollinger_position < 0.1 ? 20 : 0;
    score += bbScore;
    
    // Social attention spike
    score += factors.attentionSpike ? 15 : 0;
    
    // Whale activity and exchange flows
    score += Math.max(0, (factors.whaleActivity - 50) / 50) * 10;
    score += Math.max(0, Math.abs(factors.exchangeFlowSignal - 50) / 50) * 5;

    return Math.min(100, score);
  }

  private calculateRiskScore(factors: any): number {
    let score = 0;
    
    // High volatility increases risk
    score += factors.volatilityRegime === 'extreme' ? 40 : factors.volatilityRegime === 'high' ? 25 : 0;
    
    // Low support/resistance strength increases risk
    score += Math.max(0, (100 - factors.supportResistanceStrength) / 2);
    
    // High beta increases risk
    score += Math.max(0, (factors.marketBeta - 1) * 20);
    
    // Poor volume/price correlation increases risk
    score += Math.max(0, (1 - Math.abs(factors.volumePriceCorrelation)) * 15);
    
    // Consolidation can reduce risk
    score -= factors.consolidationPhase ? 10 : 0;

    return Math.min(100, Math.max(0, score));
  }

  // Utility functions
  private calculateSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateR2(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const slope = this.calculateSlope(values);
    const intercept = mean - slope * ((n - 1) / 2);
    
    let ssTotal = 0;
    let ssRes = 0;
    
    values.forEach((val, i) => {
      const predicted = slope * i + intercept;
      ssTotal += (val - mean) ** 2;
      ssRes += (val - predicted) ** 2;
    });
    
    return ssTotal !== 0 ? 1 - (ssRes / ssTotal) : 0;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    let numerator = 0;
    let sumXSq = 0;
    let sumYSq = 0;
    
    for (let i = 0; i < x.length; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      numerator += diffX * diffY;
      sumXSq += diffX * diffX;
      sumYSq += diffY * diffY;
    }
    
    const denominator = Math.sqrt(sumXSq * sumYSq);
    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateCovariance(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    return x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / (x.length - 1);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1);
  }
}

export const featureEngine = new FeatureEngine();
