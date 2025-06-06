
import { useState, useEffect, useCallback } from 'react';
import { dataAggregator, MarketDataPoint, OnChainMetrics, SocialMetrics } from '@/lib/ai/dataAggregator';
import { featureEngine, AdvancedFeatures } from '@/lib/ai/featureEngine';
import { predictionEngine, MarketPrediction, PatternDetection, PredictionHorizon } from '@/lib/ai/predictionEngine';
import { FlowData } from '@/types/crypto';

export interface AIInsight {
  symbol: string;
  predictions: MarketPrediction[];
  patterns: PatternDetection[];
  features: AdvancedFeatures;
  marketData: MarketDataPoint[];
  riskScore: number;
  opportunityScore: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
}

export const useAdvancedAI = (
  symbols: string[] = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'MATIC', 'AVAX'],
  timeframe: string = '4h',
  horizons: PredictionHorizon[] = ['1h', '4h', '1d', '3d', '1w']
) => {
  const [insights, setInsights] = useState<Map<string, AIInsight>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const generateInsights = useCallback(async () => {
    if (symbols.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Aggregate market data
      console.log('Aggregating market data for:', symbols);
      const marketDataMap = await dataAggregator.aggregateMarketData(symbols, timeframe);
      
      // Step 2: Generate on-chain and social metrics
      const onChainMap = await dataAggregator.generateOnChainMetrics(symbols);
      const socialMap = await dataAggregator.generateSocialMetrics(symbols);

      // Step 3: Get BTC data for correlation analysis
      const btcData = marketDataMap.get('BTC') || [];

      const newInsights = new Map<string, AIInsight>();

      // Step 4: Process each symbol
      for (const symbol of symbols) {
        const marketData = marketDataMap.get(symbol) || [];
        const onChainData = onChainMap.get(symbol) || [];
        const socialData = socialMap.get(symbol) || [];

        if (marketData.length === 0) {
          console.warn(`No market data available for ${symbol}`);
          continue;
        }

        // Generate advanced features
        const features = featureEngine.generateAdvancedFeatures(
          marketData,
          onChainData,
          socialData,
          btcData
        );

        if (features.length === 0) {
          console.warn(`No features generated for ${symbol}`);
          continue;
        }

        const latestFeatures = features[features.length - 1];
        const currentPrice = marketData[marketData.length - 1].price;

        // Generate predictions for different horizons
        const predictions = predictionEngine.generatePredictions(
          features,
          currentPrice,
          horizons
        );

        // Detect patterns
        const patterns = predictionEngine.detectPatterns(features);

        // Calculate composite scores
        const riskScore = latestFeatures.riskScore;
        const opportunityScore = calculateOpportunityScore(latestFeatures, predictions);
        const recommendation = generateRecommendation(latestFeatures, predictions, riskScore, opportunityScore);
        const confidence = calculateOverallConfidence(predictions, patterns, latestFeatures);

        newInsights.set(symbol, {
          symbol,
          predictions,
          patterns,
          features: latestFeatures,
          marketData,
          riskScore,
          opportunityScore,
          recommendation,
          confidence
        });
      }

      setInsights(newInsights);
      setLastUpdate(new Date());
      console.log(`Generated insights for ${newInsights.size} symbols`);

    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(','), timeframe, horizons.join(',')]);

  // Auto-refresh insights
  useEffect(() => {
    generateInsights();

    // Set up auto-refresh interval (every 5 minutes for real-time analysis)
    const interval = setInterval(generateInsights, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [generateInsights]);

  const calculateOpportunityScore = (
    features: AdvancedFeatures,
    predictions: MarketPrediction[]
  ): number => {
    let score = 0;

    // Base opportunity from features
    score += features.bullishScore * 0.3;
    score += features.explosivePotential * 0.4;
    score += (100 - features.riskScore) * 0.2;

    // Add prediction consensus
    const bullishPredictions = predictions.filter(p => p.direction === 'bullish').length;
    const totalPredictions = predictions.length;
    const consensusBonus = (bullishPredictions / totalPredictions) * 10;
    score += consensusBonus;

    return Math.min(100, Math.max(0, score));
  };

  const generateRecommendation = (
    features: AdvancedFeatures,
    predictions: MarketPrediction[],
    riskScore: number,
    opportunityScore: number
  ): AIInsight['recommendation'] => {
    // Get short-term and medium-term predictions
    const shortTerm = predictions.find(p => p.horizon === '4h') || predictions[0];
    const mediumTerm = predictions.find(p => p.horizon === '1d') || predictions[0];

    if (!shortTerm || !mediumTerm) return 'hold';

    const avgConfidence = (shortTerm.confidence + mediumTerm.confidence) / 2;
    
    // Strong signals with high confidence
    if (avgConfidence > 75 && opportunityScore > 80 && riskScore < 40) {
      return shortTerm.direction === 'bullish' ? 'strong_buy' : 'strong_sell';
    }

    // Good signals with medium confidence
    if (avgConfidence > 60 && opportunityScore > 60 && riskScore < 60) {
      return shortTerm.direction === 'bullish' ? 'buy' : 'sell';
    }

    // High risk or low confidence
    if (riskScore > 70 || avgConfidence < 50) {
      return 'hold';
    }

    // Default to direction with slight bias toward bullish
    return shortTerm.direction === 'bullish' ? 'buy' : shortTerm.direction === 'bearish' ? 'sell' : 'hold';
  };

  const calculateOverallConfidence = (
    predictions: MarketPrediction[],
    patterns: PatternDetection[],
    features: AdvancedFeatures
  ): number => {
    if (predictions.length === 0) return 0;

    // Average prediction confidence
    const avgPredictionConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    // Pattern confirmation bonus
    const strongPatterns = patterns.filter(p => p.confidence > 70).length;
    const patternBonus = Math.min(20, strongPatterns * 5);

    // Feature clarity bonus
    const featureClarity = (Math.abs(features.bullishScore - 50) + Math.abs(features.bearishScore - 50)) / 2;
    const clarityBonus = featureClarity * 0.2;

    // Risk penalty
    const riskPenalty = features.riskScore * 0.1;

    const confidence = avgPredictionConfidence + patternBonus + clarityBonus - riskPenalty;
    return Math.min(100, Math.max(0, confidence));
  };

  const getTopOpportunities = (minConfidence: number = 70): AIInsight[] => {
    return Array.from(insights.values())
      .filter(insight => insight.confidence >= minConfidence && insight.opportunityScore > 60)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);
  };

  const getHighRiskAssets = (minRisk: number = 70): AIInsight[] => {
    return Array.from(insights.values())
      .filter(insight => insight.riskScore >= minRisk)
      .sort((a, b) => b.riskScore - a.riskScore);
  };

  const getInsightsByRecommendation = (recommendation: AIInsight['recommendation']): AIInsight[] => {
    return Array.from(insights.values())
      .filter(insight => insight.recommendation === recommendation)
      .sort((a, b) => b.confidence - a.confidence);
  };

  return {
    insights,
    isLoading,
    error,
    lastUpdate,
    refreshInsights: generateInsights,
    getTopOpportunities,
    getHighRiskAssets,
    getInsightsByRecommendation
  };
};
