
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput, validateSymbol, checkRateLimit } from '@/utils/inputValidation';

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

    // Rate limiting check
    if (!checkRateLimit('price-action-signals', 10, 60000)) {
      setError('Rate limit exceeded. Please wait before making more requests.');
      return;
    }

    // Validate and sanitize symbols for security
    const validSymbols = symbols
      .slice(0, 50) // Limit number of symbols to prevent abuse
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
          // Don't expose detailed database errors to users
          setError('Failed to fetch price signals. Please try again.');
          return;
        }

        console.log('Fetched price action signals:', data);

        const signalsMap = new Map<string, PriceActionSignal>();
        
        if (data) {
          data.forEach((signal) => {
            // Additional validation of returned data
            if (signal.symbol && validateSymbol(signal.symbol)) {
              // Validate explosive_potential value
              const validPotentials = ['High', 'Medium', 'Low', 'None'];
              const explosivePotential = validPotentials.includes(signal.explosive_potential) 
                ? signal.explosive_potential as 'High' | 'Medium' | 'Low' | 'None'
                : 'None';

              signalsMap.set(signal.symbol, {
                symbol: signal.symbol,
                explosivePotential,
                isBreakout: Boolean(signal.is_breakout),
                isExpansion: Boolean(signal.is_expansion),
                isAccelerating: Boolean(signal.is_accelerating),
                lastUpdated: signal.last_updated || new Date().toISOString()
              });
            }
          });
        }

        setSignals(signalsMap);
      } catch (err) {
        console.error('Error fetching price action signals:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setSignalsLoading(false);
      }
    };

    // Debounce the fetch to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      fetchSignals();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [symbols.join(',')]);

  return { signals, signalsLoading, error };
};
