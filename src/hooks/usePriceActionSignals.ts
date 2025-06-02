import { supabase } from '@/integrations/supabase/client'; // Adjust path if needed
import { useState, useEffect } from 'react';

/**
 * Interface representing the structure of data expected from the
 * 'crypto_price_action_signals' table in Supabase.
 */
export interface PriceActionSignal {
  symbol: string;
  explosive_potential: 'High (Breakout + Momentum)' | 'High (Expansion + Momentum)' | 'Medium (Breakout/Expansion)' | 'Low (Momentum Acceleration)' | 'None';
  is_breakout: boolean;
  is_expansion: boolean;
  is_accelerating: boolean;
  last_updated?: string; // Optional: Add if the column exists and is needed
}

/**
 * Custom React hook to fetch price action signals for a list of symbols
 * from the Supabase 'crypto_price_action_signals' table.
 *
 * @param symbols - An array of crypto symbols (e.g., ['BTC', 'ETH', 'SOL']).
 * @returns An object containing:
 *   - signals: A Map where keys are symbols and values are PriceActionSignal objects.
 *   - loading: A boolean indicating if the data is currently being fetched.
 */
export function usePriceActionSignals(symbols: string[]) {
  const [signals, setSignals] = useState<Map<string, PriceActionSignal>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Clear signals and stop loading if no symbols are provided
    if (!symbols || symbols.length === 0) {
      setSignals(new Map());
      setLoading(false);
      return;
    }

    const fetchSignals = async () => {
      setLoading(true);
      try {
        // Fetch data from the Supabase table
        const { data, error } = await supabase
          .from('crypto_price_action_signals') // Ensure this is the correct table name
          .select('symbol, explosive_potential, is_breakout, is_expansion, is_accelerating') // Select required columns
          .in('symbol', symbols); // Filter by the provided symbols

        if (error) {
          console.error('Supabase error fetching price action signals:', error);
          throw error; // Re-throw the error to be caught by the catch block
        }

        // Process the fetched data into a Map
        const signalMap = new Map<string, PriceActionSignal>();
        if (data) {
          data.forEach(signal => {
            // Type assertion might be needed depending on Supabase client version/config
            signalMap.set(signal.symbol, signal as PriceActionSignal);
          });
        }
        setSignals(signalMap);

      } catch (error) {
        // Handle errors during the fetch process
        console.error('Error in fetchSignals:', error);
        setSignals(new Map()); // Clear signals on error
      } finally {
        // Ensure loading state is always set to false after attempt
        setLoading(false);
      }
    };

    fetchSignals();

    // --- Optional: Implement Supabase Realtime Subscription --- 
    // Example (uncomment and adapt if needed):
    /*
    const channel = supabase
      .channel('price_action_signals_updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'crypto_price_action_signals',
          filter: `symbol=in.(${symbols.map(s => `'${s}'`).join(',')})` // Filter updates for relevant symbols
        },
        (payload) => {
          console.log('Change received!', payload);
          // Re-fetch data or update the specific signal in the map based on payload
          fetchSignals(); // Simple approach: re-fetch all on any change
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription when the component unmounts or symbols change
    return () => {
      supabase.removeChannel(channel);
    };
    */
    // --- End Optional Realtime --- 

  // Effect dependency: re-run when the list of symbols changes
  }, [JSON.stringify(symbols)]); // Stringify to compare array content

  return { signals, loading };
}

