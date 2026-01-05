import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { binanceStreamManager, BinanceTickerData } from '@/hooks/useBinanceWebSocket';

interface BinanceWebSocketContextType {
  subscribe: (symbol: string, callback: (data: BinanceTickerData) => void) => () => void;
  getTicker: (symbol: string) => BinanceTickerData | undefined;
  isConnected: boolean;
}

const BinanceWebSocketContext = createContext<BinanceWebSocketContextType | null>(null);

export const BinanceWebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((symbol: string, callback: (data: BinanceTickerData) => void) => {
    setIsConnected(true);
    return binanceStreamManager.subscribe(symbol, callback);
  }, []);

  const getTicker = useCallback((symbol: string) => {
    return binanceStreamManager.getTicker(symbol);
  }, []);

  return (
    <BinanceWebSocketContext.Provider value={{ subscribe, getTicker, isConnected }}>
      {children}
    </BinanceWebSocketContext.Provider>
  );
};

export const useBinanceWS = () => {
  const context = useContext(BinanceWebSocketContext);
  if (!context) {
    throw new Error('useBinanceWS must be used within BinanceWebSocketProvider');
  }
  return context;
};

// Hook for single symbol subscription with real-time updates
export const useRealtimePrice = (symbol: string) => {
  const { subscribe, getTicker } = useBinanceWS();
  const [ticker, setTicker] = useState<BinanceTickerData | undefined>(() => getTicker(symbol));

  useEffect(() => {
    if (!symbol) return;
    
    // Get initial cached value
    const cached = getTicker(symbol);
    if (cached) setTicker(cached);

    // Subscribe to updates
    const unsubscribe = subscribe(symbol, (data) => {
      setTicker(data);
    });

    return unsubscribe;
  }, [symbol, subscribe, getTicker]);

  return ticker;
};
