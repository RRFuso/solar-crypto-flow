
import { useQuery } from '@tanstack/react-query';
import { fetchMarketRotationData } from '@/lib/marketIndicesData';
import { IndexRotationResult } from '@/types/indices';
import { toast } from 'sonner';

export function useMarketRotation(period: string = '7d') {
  return useQuery({
    queryKey: ['market-rotation', period],
    queryFn: () => fetchMarketRotationData(period),
    refetchInterval: 300000, // Atualiza a cada 5 minutos para evitar limites de API
    staleTime: 120000, // Considera dados atuais por 2 minutos
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Falha ao buscar dados de rotação do mercado:', error);
        toast.error('Não foi possível atualizar os dados de mercado', {
          description: 'Usando dados em cache ou simulados',
        });
      }
    }
  });
}
