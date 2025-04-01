
import { useQuery } from '@tanstack/react-query';
import { fetchMarketRotationData } from '@/lib/marketIndicesData';
import { IndexRotationResult } from '@/types/indices';

export function useMarketRotation(period: string = '7d') {
  return useQuery({
    queryKey: ['market-rotation', period],
    queryFn: () => fetchMarketRotationData(period),
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000,
    meta: {
      onError: (error: Error) => {
        console.error('Falha ao buscar dados de rotação do mercado:', error);
      }
    }
  });
}
