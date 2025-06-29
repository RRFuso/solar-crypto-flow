
import { useQuery } from '@tanstack/react-query';
import { FlowData } from '@/types/crypto';
import { fetchFlowAnalysis } from '@/lib/api/capitalFlowApi';
import { toast } from 'sonner';

export const useFlowAnalysis = (flowData: FlowData[]) => {
  return useQuery({
    queryKey: ['flow-analysis', flowData.map(f => f.id).join('-')],
    queryFn: () => fetchFlowAnalysis(flowData),
    enabled: flowData.length > 0,
    staleTime: 60000, // Refresh every minute
    refetchOnWindowFocus: true,
    meta: {
      onError: () => {
        toast.error("Falha ao obter análise de fluxo", {
          description: "Os dados de categoria podem estar desatualizados"
        });
      }
    }
  });
};
