import { useState, useEffect, useCallback, useMemo } from 'react';
import { binanceStreamManager, BinanceTickerData } from './useBinanceWebSocket';

export interface RealtimePriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent: number;
  volume: number;
  lastUpdate: number;
  isRealtime: boolean;
}

// Legacy single-symbol hook for backward compatibility
export function useLegacyRealtimePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setPrice(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to WebSocket for real-time updates
    const unsubscribe = binanceStreamManager.subscribe(symbol.toUpperCase(), (ticker) => {
      setPrice(ticker.price);
      setLoading(false);
      setError(null);
    });

    // Timeout to mark as not loading if no data comes
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [symbol]);

  return { price, loading, error };
}

/**
 * Hook that provides real-time price updates via Binance WebSocket
 * Supports multiple symbols for efficient batch streaming
 */
export function useRealtimePrice(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, RealtimePriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Memoize symbols to prevent unnecessary effect triggers
  const symbolsKey = useMemo(() => symbols.sort().join(','), [symbols]);

  useEffect(() => {
    if (symbols.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to each symbol
    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      
      const unsubscribe = binanceStreamManager.subscribe(upperSymbol, (ticker: BinanceTickerData) => {
        setIsConnected(true);
        
        setPrices(prev => {
          const next = new Map(prev);
          next.set(upperSymbol, {
            symbol: upperSymbol,
            price: ticker.price,
            priceChange24h: ticker.priceChange,
            priceChangePercent: ticker.priceChangePercent,
            volume: ticker.volume,
            lastUpdate: ticker.lastUpdate,
            isRealtime: true,
          });
          return next;
        });
      });
      
      unsubscribers.push(unsubscribe);
    });

    console.log('[RealtimePrice] Subscribed to', symbols.length, 'symbols');

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [symbolsKey]);

  // Get price for a specific symbol
  const getPrice = useCallback((symbol: string): RealtimePriceData | undefined => {
    return prices.get(symbol.toUpperCase());
  }, [prices]);

  return {
    prices,
    getPrice,
    isConnected,
    symbolCount: prices.size,
  };
}

/**
 * Hook that merges WebSocket prices with existing crypto data
 * Provides a unified interface for components that need both static and real-time data
 */
export function useMergedPriceData(
  symbols: string[],
  staticData: Map<string, { price?: number; priceChange24h?: number; volume?: number }>
) {
  const { prices: realtimePrices, isConnected } = useRealtimePrice(symbols);

  const mergedData = useMemo(() => {
    const merged = new Map<string, {
      price: number;
      priceChange24h: number;
      volume: number;
      isRealtime: boolean;
    }>();

    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      const realtime = realtimePrices.get(upperSymbol);
      const staticInfo = staticData.get(upperSymbol) || staticData.get(symbol);

      if (realtime) {
        // Prefer real-time data
        merged.set(upperSymbol, {
          price: realtime.price,
          priceChange24h: realtime.priceChange24h,
          volume: realtime.volume,
          isRealtime: true,
        });
      } else if (staticInfo) {
        // Fall back to static data
        merged.set(upperSymbol, {
          price: staticInfo.price || 0,
          priceChange24h: staticInfo.priceChange24h || 0,
          volume: staticInfo.volume || 0,
          isRealtime: false,
        });
      }
    });

    return merged;
  }, [symbols, realtimePrices, staticData]);

  return {
    mergedData,
    isConnected,
    realtimeCount: realtimePrices.size,
  };
}
