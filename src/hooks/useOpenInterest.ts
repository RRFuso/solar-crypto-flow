import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchOpenInterestData, OITimeframe, OIUnavailableError, tfMs } from '@/lib/openInterest/binanceOI';
import { analyzeOpenInterest } from '@/lib/openInterest/indicators';
import { setOISelection } from '@/lib/openInterest/oiSelectionStore';

export function useOpenInterest(baseSymbol: string | undefined, timeframe: OITimeframe) {
  const sym = (baseSymbol || '').toUpperCase();

  useEffect(() => {
    if (sym) setOISelection({ symbol: sym, timeframe });
  }, [sym, timeframe]);

  return useQuery({
    queryKey: ['open-interest', sym, timeframe],
    enabled: !!sym,
    queryFn: async () => {
      const raw = await fetchOpenInterestData(sym, timeframe);
      return analyzeOpenInterest(raw);
    },
    staleTime: Math.min(tfMs(timeframe), 5 * 60_000),
    refetchInterval: Math.max(60_000, Math.min(tfMs(timeframe), 5 * 60_000)),
    refetchOnWindowFocus: false,
    retry: (count, err) => !(err instanceof OIUnavailableError) && count < 2,
  });
}
