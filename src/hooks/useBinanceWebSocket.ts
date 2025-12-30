import { useState, useEffect, useCallback, useRef } from 'react';

// ========== TYPES ==========
export interface BinanceTickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  lastUpdate: number;
}

export interface WebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

// ========== CONSTANTS ==========
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

// ========== HOOK ==========
export function useBinanceWebSocket(symbols: string[]) {
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

  // Cleanup function
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

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!mountedRef.current || symbols.length === 0) return;
    
    cleanup();
    
    // Build stream names for mini ticker
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@miniTicker`).join('/');
    const wsUrl = `${BINANCE_WS_URL}/${streams}`;
    
    console.log('[WS] Connecting to Binance:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WS] Connected to Binance');
        setState(prev => ({
          ...prev,
          isConnected: true,
          reconnectAttempts: 0,
          lastError: null,
        }));
        
        // Start heartbeat
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
          
          // Handle mini ticker data
          if (data.e === '24hrMiniTicker') {
            const ticker: BinanceTickerData = {
              symbol: data.s.replace('USDT', ''),
              price: parseFloat(data.c),
              priceChange: parseFloat(data.c) - parseFloat(data.o),
              priceChangePercent: ((parseFloat(data.c) - parseFloat(data.o)) / parseFloat(data.o)) * 100,
              volume: parseFloat(data.v),
              quoteVolume: parseFloat(data.q),
              lastUpdate: Date.now(),
            };
            
            setTickers(prev => {
              const next = new Map(prev);
              next.set(ticker.symbol, ticker);
              return next;
            });
          }
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WS] WebSocket error:', error);
        if (!mountedRef.current) return;
        setState(prev => ({
          ...prev,
          lastError: 'WebSocket connection error',
        }));
      };
      
      ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason);
        if (!mountedRef.current) return;
        
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
        
        // Attempt reconnection
        if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            }));
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WS] Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        lastError: 'Failed to create WebSocket connection',
      }));
    }
  }, [symbols, cleanup, state.reconnectAttempts]);

  // Get ticker for a specific symbol
  const getTicker = useCallback((symbol: string): BinanceTickerData | undefined => {
    return tickers.get(symbol.toUpperCase());
  }, [tickers]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    connect();
  }, [connect]);

  // Effect to connect on mount and when symbols change
  useEffect(() => {
    mountedRef.current = true;
    
    if (symbols.length > 0) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [symbols.join(',')]); // Only reconnect when symbols actually change

  return {
    tickers,
    getTicker,
    isConnected: state.isConnected,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,
    reconnect,
  };
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
    
    const streams = symbols.map(s => `${s.toLowerCase()}usdt@miniTicker`).join('/');
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
        
        if (data.e === '24hrMiniTicker') {
          const symbol = data.s.replace('USDT', '');
          const ticker: BinanceTickerData = {
            symbol,
            price: parseFloat(data.c),
            priceChange: parseFloat(data.c) - parseFloat(data.o),
            priceChangePercent: ((parseFloat(data.c) - parseFloat(data.o)) / parseFloat(data.o)) * 100,
            volume: parseFloat(data.v),
            quoteVolume: parseFloat(data.q),
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
    return this.tickers.get(symbol.toUpperCase());
  }
}

export const binanceStreamManager = BinanceStreamManager.getInstance();
