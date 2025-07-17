import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimePrice = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setPrice(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Function to fetch initial price
    const fetchInitialPrice = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('crypto_historical_data')
          .select('price')
          .eq('symbol', symbol)
          .single();

        if (supabaseError) {
          console.error('Supabase error fetching initial price:', supabaseError);
          setError('Failed to fetch initial price.');
          setPrice(null);
          return;
        }

        if (data) {
          setPrice(data.price);
        } else {
          setPrice(null);
        }
      } catch (err) {
        console.error('Error fetching initial price:', err);
        setError('Network error during initial price fetch.');
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPrice();

    // Set up Realtime subscription
    const channel = supabase
      .channel(`price_changes_${symbol}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crypto_prices', filter: `symbol=eq.${symbol}` },
        (payload) => {
          console.log('Realtime price update received:', payload);
          if (payload.new && (payload.new as { price: number }).price !== undefined) {
            setPrice((payload.new as { price: number }).price);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime subscription to ${symbol} prices SUBSCRIBED`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription to ${symbol} prices CHANNEL_ERROR`);
        } else if (status === 'CLOSED') {
          console.log(`Realtime subscription to ${symbol} prices CLOSED`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`Realtime subscription to ${symbol} prices REMOVED`);
    };
  }, [symbol]);

  return { price, loading, error };
};
