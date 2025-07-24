
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceActionSignal {
  symbol: string;
  explosivePotential: 'High' | 'Medium' | 'Low' | 'None';
  isBreakout: boolean;
  isExpansion: boolean;
  isAccelerating: boolean;
  lastUpdated: string;
}

export const usePriceActionSignals = (symbols: string[]) => {
  const [signals, setSignals] = useState<Map<string, PriceActionSignal>>(new Map());
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    setSignalsLoading(true);
    setError(null);

    // Initial fetch for current data
    const fetchInitialSignals = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('crypto_price_action_signals')
          .select('*')
          .in('symbol', symbols);

        console.log('Supabase raw data for price action signals:', data);

        if (supabaseError) {
          console.error('Supabase error fetching initial price action signals:', supabaseError);
          setError('Failed to fetch initial price signals.');
          return;
        }

        const signalsMap = new Map<string, PriceActionSignal>();
        if (data) {
          data.forEach((signal) => {
            const validPotentials = ['High', 'Medium', 'Low', 'None'];
            const explosivePotential = validPotentials.includes(signal.explosive_potential) 
              ? signal.explosive_potential as 'High' | 'Medium' | 'Low' | 'None'
              : 'None';
            console.log(`Processing signal for ${signal.symbol}: explosive_potential from DB = ${signal.explosive_potential}, assigned = ${explosivePotential}`);

            signalsMap.set(signal.symbol, {
              symbol: signal.symbol,
              explosivePotential,
              isBreakout: Boolean(signal.is_breakout),
              isExpansion: Boolean(signal.is_expansion),
              isAccelerating: Boolean(signal.is_accelerating),
              lastUpdated: signal.last_updated || new Date().toISOString()
            });
          });
        }
        setSignals(signalsMap);
        console.log('Final signals map after initial fetch:', signalsMap);
      } catch (err) {
        console.error('Error fetching initial price action signals:', err);
        setError('Network error during initial fetch.');
      } finally {
        setSignalsLoading(false);
      }
    };

    fetchInitialSignals();

    // Set up Realtime subscription
    const channel = supabase
      .channel('price_action_signals_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crypto_price_action_signals' },
        (payload) => {
          console.log('Realtime change received:', payload);
          setRealtimeConnected(true);
          const newSignal = payload.new as PriceActionSignal;
          if (newSignal && newSignal.symbol) {
            setSignals((prevSignals) => {
              const newSignalsMap = new Map(prevSignals);
              const validPotentials = ['High', 'Medium', 'Low', 'None'];
              const explosivePotential = validPotentials.includes(newSignal.explosivePotential) 
                ? newSignal.explosivePotential as 'High' | 'Medium' | 'Low' | 'None'
                : 'None';

              newSignalsMap.set(newSignal.symbol, {
                symbol: newSignal.symbol,
                explosivePotential,
                isBreakout: Boolean(newSignal.isBreakout),
                isExpansion: Boolean(newSignal.isExpansion),
                isAccelerating: Boolean(newSignal.isAccelerating),
                lastUpdated: newSignal.lastUpdated || new Date().toISOString()
              });
              return newSignalsMap;
            });
            console.log(`Realtime signal updated for ${newSignal.symbol}`);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          console.log('Realtime subscription to crypto_price_action_signals SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeConnected(false);
          console.error('Realtime subscription CHANNEL_ERROR');
        } else if (status === 'CLOSED') {
          setRealtimeConnected(false);
          console.log('Realtime subscription CLOSED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log('Realtime subscription to crypto_price_action_signals REMOVED');
    };
  }, []); // Re-subscribe if symbols change

  return { signals, signalsLoading, error, realtimeConnected };
};
