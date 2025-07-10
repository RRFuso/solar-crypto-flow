import { useState, useEffect, useRef } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

export interface RealtimeTicker {
  symbol: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Debounce function to limit how often a function can run
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

export const useRealtimeTicker = (symbols: string[]) => {
  const [tickers, setTickers] = useState<Map<string, RealtimeTicker>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const ws = useRef<WebSocket | null>(null);

  // Using a ref to store the latest symbols to avoid re-running the effect on every symbol change
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  // Debounced state update to prevent excessive re-renders
  const debouncedSetTickers = useRef(debounce((newTickers: Map<string, RealtimeTicker>) => {
    setTickers(new Map(newTickers));
  }, 100)).current;

  useEffect(() => {
    if (!symbols || symbols.length === 0) {
      setConnectionStatus('disconnected');
      return;
    }

    const connect = () => {
      setConnectionStatus('connecting');
      const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
      const url = `${BINANCE_WS_URL}/${streams}`;
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected to Binance stream.');
        setConnectionStatus('connected');
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // For single stream
        const streamData = message.data ? message.data : message;

        if (streamData && streamData.s) {
          const newTicker: RealtimeTicker = {
            symbol: streamData.s,
            price: streamData.c,
            priceChangePercent: streamData.P,
            volume: streamData.v,
            quoteVolume: streamData.q,
          };
          
          // Update the map and schedule a debounced update
          setTickers(prev => {
            const newMap = new Map(prev);
            newMap.set(newTicker.symbol, newTicker);
            debouncedSetTickers(newMap);
            return newMap;
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionStatus('disconnected');
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected.');
        setConnectionStatus('disconnected');
        // Optional: implement reconnect logic here
      };
    };

    connect();

    return () => {
      if (ws.current) {
        console.log('[WebSocket] Closing connection.');
        ws.current.close();
        setConnectionStatus('disconnected');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')]); // Re-connect only if the list of symbols fundamentally changes

  return { tickers, connectionStatus };
};