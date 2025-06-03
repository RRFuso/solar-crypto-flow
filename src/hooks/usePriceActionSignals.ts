
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput, validateSymbol } from '@/utils/inputValidation';

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
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setSignals(new Map());
      return;
    }

    // Validate and sanitize symbols for security
    const validSymbols = symbols
      .map(symbol => sanitizeInput(symbol.toUpperCase()))
      .filter(symbol => validateSymbol(symbol));

    if (validSymbols.length === 0) {
      setError('No valid symbols provided');
      return;
    }

    const fetchSignals = async () => {
      setSignalsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching price action signals for validated symbols:', validSymbols);
        
        const { data, error: supabaseError } = await supabase
          .from('crypto_price_action_signals')
          .select('*')
          .in('symbol', validSymbols);

        if (supabaseError) {
          console.error('Supabase error fetching price action signals:', supabaseError);
          setError(supabaseError.message);
          return;
        }

        console.log('Fetched price action signals:', data);

        const signalsMap = new Map<string, PriceActionSignal>();
        
        if (data) {
          data.forEach((signal) => {
            // Additional validation of returned data
            if (signal.symbol && validateSymbol(signal.symbol)) {
              signalsMap.set(signal.symbol, {
                symbol: signal.symbol,
                explosivePotential: (signal.explosive_potential as 'High' | 'Medium' | 'Low' | 'None') || 'None',
                isBreakout: signal.is_breakout || false,
                isExpansion: signal.is_expansion || false,
                isAccelerating: signal.is_accelerating || false,
                lastUpdated: signal.last_updated
              });
            }
          });
        }

        setSignals(signalsMap);
      } catch (err) {
        console.error('Error fetching price action signals:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSignalsLoading(false);
      }
    };

    fetchSignals();
  }, [symbols.join(',')]);

  return { signals, signalsLoading, error };
};
