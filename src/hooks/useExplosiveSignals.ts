import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { explosiveSignalEngine, ExplosivePrediction } from '@/lib/ai/explosiveSignalEngine';
import { advancedFeatureExtractor } from '@/lib/ai/featureExtractor';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { OnChainMetrics } from '@/types/onchain';
import { toast } from 'sonner';

interface UseExplosiveSignalsOptions {
  symbols?: string[];
  enableAlerts?: boolean;
  refreshInterval?: number;
}

interface UseExplosiveSignalsReturn {
  signals: ExplosivePrediction[];
  loading: boolean;
  error: string | null;
  refreshSignals: () => void;
  lastUpdate: Date | null;
}

export const useExplosiveSignals = (options: UseExplosiveSignalsOptions = {}): UseExplosiveSignalsReturn => {
  const { symbols, enableAlerts = true, refreshInterval = 60000 } = options;
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [previousSignals, setPreviousSignals] = useState<ExplosivePrediction[]>([]);
  const { onChainData, requestOnChainData } = useOnChainData();

  // Fetch crypto data for analysis
  const { data: cryptoData, isLoading: loadingCrypto, error: cryptoError, refetch } = useQuery({
    queryKey: ['explosive-signals-crypto', symbols],
    queryFn: async () => {
      const data = await fetchCryptoData();
      return symbols ? data.filter(crypto => symbols.includes(crypto.symbol)) : data;
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 2
  });

  // Request on-chain data for the symbols under analysis so the context
  // has fresh whale/exchange-flow metrics ready by the time we process.
  const symbolList = useMemo(
    () => (cryptoData || []).map(c => c.symbol).filter(Boolean),
    [cryptoData]
  );
  useEffect(() => {
    if (symbolList.length > 0) requestOnChainData(symbolList);
  }, [symbolList, requestOnChainData]);

  // Snapshot of on-chain map size so react-query re-runs when new
  // on-chain metrics arrive from the context.
  const onChainVersion = onChainData.size;

  // Process signals
  const { data: signals = [], isLoading: processingSignals, error: processError } = useQuery({
    queryKey: ['explosive-signals-processed', cryptoData?.length, onChainVersion],
    queryFn: async () => {
      if (!cryptoData || cryptoData.length === 0) return [];

      try {
        console.log('🔥 Processing explosive signals for', cryptoData.length, 'cryptos');

        // Build OnChainMetrics[] from the OnChainDataContext, matching by symbol.
        // Only surfaces real fields; missing fields stay undefined so
        // featureExtractor falls back to simulate*() and marks isSimulated=true.
        const onChainMetrics: OnChainMetrics[] = cryptoData
          .map(c => {
            const entry = onChainData.get(c.symbol.toUpperCase());
            if (!entry) return null;
            const m = entry.metrics;
            const flow = entry.exchangeFlow;
            if (!m && !flow) return null;
            return {
              symbol: c.symbol,
              exchangeFlow: flow ?? {
                symbol: c.symbol,
                timestamp: Date.now(),
                netFlow: m?.netFlow ?? 0,
                inflow: m?.exchangeInflow ?? 0,
                outflow: m?.exchangeOutflow ?? 0,
              },
              whaleTransactions: entry.whaleTransactions || [],
              holderDistribution: {
                symbol: c.symbol,
                top10Percentage: 0,
                top50Percentage: 0,
                top100Percentage: 0,
              },
              // Real, from oracle:
              whaleMovements: m?.whaleTransactionCount,
              // Not yet sourced — leave undefined so extractor simulates + flags.
              activeAddresses: undefined,
              newWallets: undefined,
              dormantWakeups: undefined,
            } as OnChainMetrics;
          })
          .filter((x): x is OnChainMetrics => x !== null);

        console.log('📊 On-chain coverage:', onChainMetrics.length, '/', cryptoData.length);

        // Extract advanced features with real on-chain routed through
        const features = advancedFeatureExtractor.extractExplosiveFeatures(
          cryptoData,
          onChainMetrics,
        );
        console.log('📊 Extracted features for', features.length, 'symbols');

        // Generate explosive predictions
        const predictions = explosiveSignalEngine.processExplosiveSignals(features);
        console.log('⚡ Generated', predictions.length, 'explosive signals');

        setLastUpdate(new Date());
        return predictions;
      } catch (error) {
        console.error('Error processing explosive signals:', error);
        throw error;
      }
    },
    enabled: !!cryptoData && cryptoData.length > 0,
    staleTime: 30000,
    retry: 1
  });


  // Alert system for new high-confidence signals
  useEffect(() => {
    if (!enableAlerts || !signals.length) return;
    
    const newHighConfidenceSignals = signals.filter(signal => {
      // Only alert for high confidence signals
      if (signal.confidence < 0.7) return false;
      
      // Check if this is a new signal (not in previous batch)
      const wasInPrevious = previousSignals.some(prev => 
        prev.symbol === signal.symbol && 
        Math.abs(prev.confidence - signal.confidence) < 0.1
      );
      
      return !wasInPrevious;
    });

    // Show alerts for new signals
    newHighConfidenceSignals.forEach(signal => {
      const emoji = signal.direction === 'bullish' ? '🚀' : '📉';
      const factors = signal.primaryFactors.slice(0, 2).join(' + ');
      
      toast(`${emoji} ${signal.symbol} - ${signal.signalType}`, {
        description: `${signal.reasoning} | ${signal.recommendation.toUpperCase()}`,
        duration: 10000,
        className: signal.direction === 'bullish' ? 'bg-emerald-900/60' : 'bg-red-900/60',
      });
    });

    setPreviousSignals(signals);
  }, [signals, enableAlerts, previousSignals]);

  const loading = loadingCrypto || processingSignals;
  const error = cryptoError?.message || processError?.message || null;

  const refreshSignals = () => {
    refetch();
  };

  return {
    signals,
    loading,
    error,
    refreshSignals,
    lastUpdate
  };
};