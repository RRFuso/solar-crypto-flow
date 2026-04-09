import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FlowData } from '@/types/crypto';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMarketDataReturn {
  data: FlowData[];
  isLoading: boolean;
  isConnected: boolean;
  error: Error | null;
  refetch: () => void;
}

interface CryptoPriceRow {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  volume_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  last_updated: string | null;
}

export const useRealtimeMarketData = (): UseRealtimeMarketDataReturn => {
  const [data, setData] = useState<FlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use Map for efficient updates
  const dataMapRef = useRef<Map<string, CryptoPriceRow>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<Map<string, number>>(new Map());
  const rateLimitMs = 1000; // 1 update per second per coin

  // Convert Map to FlowData array
  const convertToFlowData = useCallback((cryptoMap: Map<string, CryptoPriceRow>): FlowData[] => {
    const cryptoArray = Array.from(cryptoMap.values());
    const btc = cryptoArray.find(c => c.symbol.toLowerCase() === 'btc');
    
    if (!btc || !btc.current_price || !btc.price_change_percentage_24h) return [];

    const flows: FlowData[] = [];
    
    cryptoArray.forEach(coin => {
      if (coin.symbol.toLowerCase() !== 'btc' && 
          coin.price_change_percentage_24h !== null && 
          coin.price_change_percentage_24h !== undefined &&
          btc.price_change_percentage_24h !== null &&
          coin.current_price &&
          coin.market_cap &&
          coin.volume_24h) {
        const relativeFlow = coin.price_change_percentage_24h - btc.price_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btc.market_cap / 10;
        
        if (Math.abs(relativeFlow) > 0.1) {
          flows.push({
            id: `btc-${coin.symbol.toLowerCase()}`,
            from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
            value: flowMagnitude,
            percentage: relativeFlow,
            marketCap: coin.market_cap,
            volume: coin.volume_24h,
            name: coin.name,
            change: coin.price_change_percentage_24h
          });
        }
      }
    });
    
    return flows;
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    console.log('[Realtime] Fetching initial market data...');
    setIsLoading(true);
    setError(null);

    try {
      const { data: cryptoData, error: fetchError } = await supabase
        .from('cryptocurrencies')
        .select('id, symbol, name, current_price, volume_24h, price_change_percentage_24h, market_cap, last_updated')
        .order('market_cap', { ascending: false })
        .limit(250);

      if (fetchError) throw fetchError;

      if (cryptoData) {
        console.log('[Realtime] Initial data loaded:', cryptoData.length, 'coins');
        
        // Build Map
        const newMap = new Map<string, CryptoPriceRow>();
        cryptoData.forEach(coin => {
          newMap.set(coin.symbol.toLowerCase(), coin);
        });
        
        dataMapRef.current = newMap;
        
        // Convert to FlowData
        const flowData = convertToFlowData(newMap);
        setData(flowData);
        console.log('[Realtime] Generated', flowData.length, 'flows');
      }
    } catch (err) {
      console.error('[Realtime] Error fetching initial data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch initial data'));
    } finally {
      setIsLoading(false);
    }
  }, [convertToFlowData]);

  // Setup Realtime subscription
  useEffect(() => {
    console.log('[Realtime] Setting up subscription...');

    // Fetch initial data
    fetchInitialData();

    // Setup Realtime channel
    const channel = supabase
      .channel('cryptocurrencies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cryptocurrencies'
        },
        (payload) => {
          console.log('[Realtime] Received change:', payload.eventType, payload.new);
          
          const now = Date.now();
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as CryptoPriceRow;
            const symbol = newData.symbol.toLowerCase();
            
            // Rate limiting: max 1 update per second per coin
            const lastUpdate = lastUpdateRef.current.get(symbol) || 0;
            if (now - lastUpdate < rateLimitMs) {
              console.log('[Realtime] Rate limited update for', symbol);
              return;
            }
            
            lastUpdateRef.current.set(symbol, now);
            
            // Update only this item in Map
            dataMapRef.current.set(symbol, newData);
            
            // Recalculate flows
            const flowData = convertToFlowData(dataMapRef.current);
            setData(flowData);
            
            console.log('[Realtime] Updated', symbol, '- Total flows:', flowData.length);
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as { symbol: string };
            const symbol = oldData.symbol.toLowerCase();
            
            // Remove from Map
            dataMapRef.current.delete(symbol);
            lastUpdateRef.current.delete(symbol);
            
            // Recalculate flows
            const flowData = convertToFlowData(dataMapRef.current);
            setData(flowData);
            
            console.log('[Realtime] Deleted', symbol, '- Total flows:', flowData.length);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('[Realtime] ✅ Connected to Realtime');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.log('[Realtime] ❌ Disconnected from Realtime');
          
          // Auto-reconnect after 5 seconds
          setTimeout(() => {
            console.log('[Realtime] Attempting to reconnect...');
            channel.subscribe();
          }, 5000);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [fetchInitialData, convertToFlowData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log('[Realtime] Manual refetch requested');
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    isLoading,
    isConnected,
    error,
    refetch
  };
};
