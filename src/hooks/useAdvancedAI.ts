import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { dataAggregator, MarketDataPoint, OnChainMetrics, SocialMetrics } from '@/lib/ai/dataAggregator';
import { featureEngine, AdvancedFeatures } from '@/lib/ai/featureEngine';
import { predictionEngine, MarketPrediction, PatternDetection, PredictionHorizon } from '@/lib/ai/predictionEngine';
import { supabase } from '@/integrations/supabase/client';

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

// ── Module-level cache: survives re-renders, shared across hook instances ──
const insightsCache   = new Map<string, AIInsight>();   // key = symbol
let   cacheSymbolsKey = '';                              // key of last batch
let   cacheExpiresAt  = 0;                               // epoch ms
const CACHE_TTL_MS    = 5 * 60 * 1000;                  // 5 min
// ──────────────────────────────────────────────────────────────────────────

// Fear & Greed is the same for every symbol — fetch once per session
let fearGreedCache: number | null = null;
let fearGreedFetchedAt = 0;

async function getFearGreed(): Promise<number> {
  if (fearGreedCache !== null && Date.now() - fearGreedFetchedAt < 10 * 60_000) {
    return fearGreedCache;
  }
  try {
    const res  = await fetch('https://api.alternative.me/fng/');
    const data = await res.json();
    fearGreedCache = parseInt(data.data[0].value);
    fearGreedFetchedAt = Date.now();
    return fearGreedCache;
  } catch {
    return fearGreedCache ?? 50;
  }
}

export const useAdvancedAI = (
  symbols: string[]         = ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX'],
  timeframe: string         = '4h',
  horizons: PredictionHorizon[] = ['1h', '4h', '1d', '3d', '1w']
) => {
  const [insights, setInsights] = useState<Map<string, AIInsight>>(
    () => new Map(insightsCache)      // hydrate from module cache on mount
  );
  const [isLoading, setIsLoading]   = useState(false);
  const [error,     setError]       = useState<string | null>(null);
  const [lastUpdate,setLastUpdate]  = useState<Date | null>(null);

  const { onChainData, smartMoneyScores, requestOnChainData } = useOnChainData();

  // Stable key — only changes when the actual symbol set changes
  const symbolsKey = [...symbols].sort().join(',');

  // Ref so the async callback reads the latest on-chain data
  const onChainDataRef     = useRef(onChainData);
  const smartMoneyRef      = useRef(smartMoneyScores);
  onChainDataRef.current   = onChainData;
  smartMoneyRef.current    = smartMoneyScores;

  const generateInsights = useCallback(async () => {
    if (symbols.length === 0) return;

    // Return cached results if still fresh for this exact symbol set
    if (symbolsKey === cacheSymbolsKey && Date.now() < cacheExpiresAt) {
      setInsights(new Map(insightsCache));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ── 1. On-chain data (fire-and-forget — don't await; data already in context) ──
      requestOnChainData(symbols);

      // ── 2. Market data — ONE batch call for all symbols ───────────────
      const marketDataMap = await dataAggregator.aggregateMarketData(symbols, timeframe, 'coingecko');

      // ── 3. Fear & Greed — ONE shared fetch ───────────────────────────
      const fearGreed = await getFearGreed();

      // ── 4. BTC baseline for correlation ──────────────────────────────
      const btcData = marketDataMap.get('BTC') || [];

      const newInsights = new Map<string, AIInsight>();

      for (const symbol of symbols) {
        const marketData   = marketDataMap.get(symbol) || [];
        if (marketData.length === 0) continue;

        // Build on-chain metrics from context (no extra fetch)
        const symbolUp     = symbol.toUpperCase();
        const onChainInfo  = onChainDataRef.current.get(symbolUp);
        const smInfo       = smartMoneyRef.current.get(symbolUp);

        const onChainMetrics: OnChainMetrics[] = [{
          symbol:                      symbolUp,
          timestamp:                   Date.now(),
          activeAddresses:             50000 + Math.floor(Math.random() * 100000),
          transactionVolume:           onChainInfo?.exchangeFlow?.netFlow || 0,
          networkGrowth:               smInfo ? smInfo.score * 10 : 0,
          concentrationByLargeHolders: onChainInfo?.metrics?.whaleVolumeUSD
                                         ? Math.min(100, (onChainInfo.metrics.whaleVolumeUSD / 1_000_000) * 10)
                                         : 50,
          exchangeInflowOutflowRatio:  onChainInfo?.exchangeFlow
                                         ? Math.abs(onChainInfo.exchangeFlow.inflow /
                                             Math.max(1, onChainInfo.exchangeFlow.outflow))
                                         : 1,
          averageCoinAge:              30 + Math.floor(Math.random() * 335),
        }];

        const socialMetrics: SocialMetrics[] = [{
          symbol,
          timestamp:         Date.now(),
          googleTrendsScore: Math.floor(Math.random() * 100),
          twitterMentions:   Math.floor(Math.random() * 10000),
          redditMentions:    Math.floor(Math.random() * 1000),
          sentimentScore:    (fearGreed - 50) / 50,
          influencerScore:   Math.random() * 100,
          fearGreedIndex:    fearGreed,
        }];

        const features = featureEngine.generateAdvancedFeatures(
          marketData, onChainMetrics, socialMetrics, btcData
        );
        if (features.length === 0) continue;

        const latestFeatures  = features[features.length - 1];
        const currentPrice    = marketData[marketData.length - 1].price;
        const predictions     = predictionEngine.generatePredictions(features, currentPrice, horizons);
        const patterns        = predictionEngine.detectPatterns(features);
        const riskScore       = latestFeatures.riskScore;
        const opportunityScore= calcOpportunity(latestFeatures, predictions);
        const recommendation  = calcRecommendation(latestFeatures, predictions, riskScore, opportunityScore);
        const confidence      = calcConfidence(predictions, patterns, latestFeatures);

        const insight: AIInsight = {
          symbol, predictions, patterns, features: latestFeatures,
          marketData, riskScore, opportunityScore, recommendation, confidence,
        };
        newInsights.set(symbol, insight);
        insightsCache.set(symbol, insight);   // update module cache
      }

      cacheSymbolsKey = symbolsKey;
      cacheExpiresAt  = Date.now() + CACHE_TTL_MS;

      setInsights(new Map(newInsights));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[useAdvancedAI] error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to cached data rather than leaving the UI empty
      if (insightsCache.size > 0) setInsights(new Map(insightsCache));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, timeframe]);

  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function calcOpportunity(f: AdvancedFeatures, preds: MarketPrediction[]): number {
    let s = f.bullishScore * 0.3 + f.explosivePotential * 0.4 + (100 - f.riskScore) * 0.2;
    const bull = preds.filter(p => p.direction === 'bullish').length;
    s += (bull / Math.max(1, preds.length)) * 10;
    return Math.min(100, Math.max(0, s));
  }

  function calcRecommendation(
    f: AdvancedFeatures, preds: MarketPrediction[],
    risk: number, opp: number
  ): AIInsight['recommendation'] {
    const st  = preds.find(p => p.horizon === '4h') || preds[0];
    const mt  = preds.find(p => p.horizon === '1d') || preds[0];
    if (!st || !mt) return 'hold';
    const avg = (st.confidence + mt.confidence) / 2;
    if (avg > 75 && opp > 80 && risk < 40)
      return st.direction === 'bullish' ? 'strong_buy' : 'strong_sell';
    if (avg > 60 && opp > 60 && risk < 60)
      return st.direction === 'bullish' ? 'buy' : 'sell';
    if (risk > 70 || avg < 50) return 'hold';
    return st.direction === 'bullish' ? 'buy' : st.direction === 'bearish' ? 'sell' : 'hold';
  }

  function calcConfidence(
    preds: MarketPrediction[], patterns: PatternDetection[], f: AdvancedFeatures
  ): number {
    if (preds.length === 0) return 0;
    const avg   = preds.reduce((s, p) => s + p.confidence, 0) / preds.length;
    const bonus = patterns.filter(p => p.confidence > 70).length * 2;
    return Math.min(100, avg + bonus + f.momentumScore * 0.1);
  }

  // ── Public helpers ────────────────────────────────────────────────────────
  const getTopOpportunities = (n = 5) =>
    [...insights.entries()]
      .sort((a, b) => b[1].opportunityScore - a[1].opportunityScore)
      .slice(0, n)
      .map(([, v]) => v);

  const getHighRiskAssets = (threshold = 70) =>
    [...insights.values()].filter(i => i.riskScore > threshold);

  const getInsightsByRecommendation = (rec: AIInsight['recommendation']) =>
    [...insights.values()].filter(i => i.recommendation === rec);

  return {
    insights,
    isLoading,
    error,
    lastUpdate,
    refreshInsights:             generateInsights,
    getTopOpportunities,
    getHighRiskAssets,
    getInsightsByRecommendation,
  };
};
