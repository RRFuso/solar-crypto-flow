import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ========== TYPES ==========
export interface BinanceTickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  lastUpdate: number;
}

export interface WebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

export interface SingleSymbolData {
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: Error | null;
}

// ========== CONSTANTS ==========
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

// ========== SINGLE SYMBOL HOOK ==========
/**
 * Hook for subscribing to a single symbol's real-time data
 * Usage: const { price, isConnected } = useBinanceWebSocket('BTCUSDT');
 */
export function useBinanceWebSocket(symbol: string): SingleSymbolData;
/**
 * Hook for subscribing to multiple symbols' real-time data
 * Usage: const { tickers, isConnected } = useBinanceWebSocket(['BTC', 'ETH']);
 */
export function useBinanceWebSocket(symbols: string[]): {
  tickers: Map<string, BinanceTickerData>;
  getTicker: (symbol: string) => BinanceTickerData | undefined;
  isConnected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  reconnect: () => void;
};

export function useBinanceWebSocket(symbolOrSymbols: string | string[]) {
  // Handle single symbol case
  if (typeof symbolOrSymbols === 'string') {
    return useSingleSymbol(symbolOrSymbols);
  }
  
  // Handle multiple symbols case
  return useMultipleSymbols(symbolOrSymbols);
}

// ========== SINGLE SYMBOL IMPLEMENTATION ==========
function useSingleSymbol(symbol: string): SingleSymbolData {
  const [data, setData] = useState<SingleSymbolData>({
    price: 0,
    bid: 0,
    ask: 0,
    volume24h: 0,
    change24h: 0,
    changePercent24h: 0,
    high24h: 0,
    low24h: 0,
    isConnected: false,
    lastUpdate: null,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !symbol) return;
    
    cleanup();
    
    // Normalize symbol (remove USDT if already present, then add it)
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '') + 'USDT';
    const streamName = normalizedSymbol.toLowerCase();
    
    // Use ticker stream for full data including bid/ask
    const wsUrl = `${BINANCE_WS_URL}/${streamName}@ticker`;
    
    console.log('[WS Single] Connecting to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WS Single] Connected for:', symbol);
        reconnectAttemptsRef.current = 0;
        setData(prev => ({ ...prev, isConnected: true, error: null }));
      };
      
      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const msg = JSON.parse(event.data);
          
          // 24hr ticker data
          if (msg.e === '24hrTicker') {
            setData({
              price: parseFloat(msg.c),
              bid: parseFloat(msg.b),
              ask: parseFloat(msg.a),
              volume24h: parseFloat(msg.q), // Quote volume
              change24h: parseFloat(msg.p),
              changePercent24h: parseFloat(msg.P),
              high24h: parseFloat(msg.h),
              low24h: parseFloat(msg.l),
              isConnected: true,
              lastUpdate: new Date(),
              error: null,
            });
          }
        } catch (error) {
          console.error('[WS Single] Parse error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WS Single] Error:', error);
        if (!mountedRef.current) return;
        setData(prev => ({ 
          ...prev, 
          error: new Error('WebSocket connection error'),
          isConnected: false 
        }));
      };
      
      ws.onclose = () => {
        console.log('[WS Single] Disconnected');
        if (!mountedRef.current) return;
        
        setData(prev => ({ ...prev, isConnected: false }));
        
        // Reconnect logic
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[WS Single] Reconnecting in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WS Single] Failed to create WebSocket:', error);
      setData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to connect'),
        isConnected: false 
      }));
    }
  }, [symbol, cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (symbol) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [symbol, connect, cleanup]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => data, [
    data.price,
    data.bid,
    data.ask,
    data.volume24h,
    data.change24h,
    data.changePercent24h,
    data.high24h,
    data.low24h,
    data.isConnected,
    data.lastUpdate,
    data.error,
  ]);
}

// ========== MULTIPLE SYMBOLS IMPLEMENTATION ==========
function useMultipleSymbols(symbols: string[]) {
  const [tickers, setTickers] = useState<Map<string, BinanceTickerData>>(new Map());
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    reconnectAttempts: 0,
    lastError: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || symbols.length === 0) return;
    
    cleanup();
    
    // Build stream names for ticker
    const streams = symbols.map(s => {
      const normalized = s.toUpperCase().replace('USDT', '') + 'USDT';
      return `${normalized.toLowerCase()}@ticker`;
    }).join('/');
    
    const wsUrl = `${BINANCE_WS_URL}/${streams}`;
    
    console.log('[WS Multi] Connecting to:', symbols.length, 'symbols');
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WS Multi] Connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          reconnectAttempts: 0,
          lastError: null,
        }));
        
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL);
      };
      
      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === '24hrTicker') {
            const ticker: BinanceTickerData = {
              symbol: data.s.replace('USDT', ''),
              price: parseFloat(data.c),
              priceChange: parseFloat(data.p),
              priceChangePercent: parseFloat(data.P),
              volume: parseFloat(data.v),
              quoteVolume: parseFloat(data.q),
              high24h: parseFloat(data.h),
              low24h: parseFloat(data.l),
              bid: parseFloat(data.b),
              ask: parseFloat(data.a),
              lastUpdate: Date.now(),
            };
            
            setTickers(prev => {
              const next = new Map(prev);
              next.set(ticker.symbol, ticker);
              return next;
            });
          }
        } catch (error) {
          console.error('[WS Multi] Parse error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WS Multi] Error:', error);
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, lastError: 'Connection error' }));
      };
      
      ws.onclose = (event) => {
        console.log('[WS Multi] Closed:', event.code);
        if (!mountedRef.current) return;
        
        setState(prev => ({ ...prev, isConnected: false }));
        
        if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WS Multi] Failed to create WebSocket:', error);
      setState(prev => ({ ...prev, lastError: 'Failed to connect' }));
    }
  }, [symbols, cleanup, state.reconnectAttempts]);

  const getTicker = useCallback((symbol: string): BinanceTickerData | undefined => {
    return tickers.get(symbol.toUpperCase().replace('USDT', ''));
  }, [tickers]);

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (symbols.length > 0) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [symbols.join(',')]);

  return useMemo(() => ({
    tickers,
    getTicker,
    isConnected: state.isConnected,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,
    reconnect,
  }), [tickers, getTicker, state.isConnected, state.reconnectAttempts, state.lastError, reconnect]);
}

// ========== SINGLETON MANAGER ==========
// For global price streaming across the app
class BinanceStreamManager {
  private static instance: BinanceStreamManager;
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<(data: BinanceTickerData) => void>>();
  private tickers = new Map<string, BinanceTickerData>();
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): BinanceStreamManager {
    if (!BinanceStreamManager.instance) {
      BinanceStreamManager.instance = new BinanceStreamManager();
    }
    return BinanceStreamManager.instance;
  }

  subscribe(symbol: string, callback: (data: BinanceTickerData) => void): () => void {
    const upperSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }
    this.subscribers.get(upperSymbol)!.add(callback);
    
    // Send cached data immediately if available
    const cached = this.tickers.get(upperSymbol);
    if (cached) {
      callback(cached);
    }
    
    // Reconnect with new symbols if needed
    this.updateConnection();
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(upperSymbol)?.delete(callback);
      if (this.subscribers.get(upperSymbol)?.size === 0) {
        this.subscribers.delete(upperSymbol);
        this.updateConnection();
      }
    };
  }

  private updateConnection() {
    const symbols = Array.from(this.subscribers.keys());
    
    if (symbols.length === 0) {
      this.disconnect();
      return;
    }
    
    // Reconnect with updated symbols
    this.connect(symbols);
  }

  private connect(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    
    // Use full ticker stream for complete data
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
    const wsUrl = `${BINANCE_WS_URL}/${streams}`;
    
    console.log('[StreamManager] Connecting:', symbols.length, 'symbols');
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('[StreamManager] Connected');
      this.reconnectAttempts = 0;
      
      this.heartbeatInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ method: 'ping' }));
        }
      }, HEARTBEAT_INTERVAL);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.e === '24hrTicker') {
          const symbol = data.s.replace('USDT', '');
          const ticker: BinanceTickerData = {
            symbol,
            price: parseFloat(data.c),
            priceChange: parseFloat(data.p),
            priceChangePercent: parseFloat(data.P),
            volume: parseFloat(data.v),
            quoteVolume: parseFloat(data.q),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            bid: parseFloat(data.b),
            ask: parseFloat(data.a),
            lastUpdate: Date.now(),
          };
          
          this.tickers.set(symbol, ticker);
          
          // Notify subscribers
          this.subscribers.get(symbol)?.forEach(cb => cb(ticker));
        }
      } catch (error) {
        console.error('[StreamManager] Parse error:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('[StreamManager] Disconnected');
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      
      // Reconnect if we still have subscribers
      if (this.subscribers.size > 0 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(Array.from(this.subscribers.keys())), delay);
      }
    };
  }

  private disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getTicker(symbol: string): BinanceTickerData | undefined {
    return this.tickers.get(symbol.toUpperCase().replace('USDT', ''));
  }
}

export const binanceStreamManager = BinanceStreamManager.getInstance();

// ========== CONVENIENCE EXPORTS ==========
export default useBinanceWebSocket;
