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

    // Function to fetch initial price (otimizado para reduzir Egress)
    const fetchInitialPrice = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('crypto_historical_data')
          .select('price') // Apenas campo necessário
          .eq('symbol', symbol)
          .limit(1) // Explicitamente limitar a 1
          .maybeSingle();

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

    // Set up Realtime subscription (otimizado)
    const channel = supabase
      .channel(`price_changes_${symbol}`, {
        config: {
          broadcast: { self: false }, // Não receber próprias mensagens
        }
      })
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'crypto_prices', 
          filter: `symbol=eq.${symbol}` 
        },
        (payload) => {
          // Remover logs desnecessários para reduzir overhead
          if (payload.new && (payload.new as any).price !== undefined) {
            setPrice((payload.new as any).price);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol]);

  return { price, loading, error };
};
