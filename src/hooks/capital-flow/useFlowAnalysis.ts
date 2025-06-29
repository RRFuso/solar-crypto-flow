import { useQuery } from '@tanstack/react-query';

interface FlowAnalysisData {
  fluxo_in: number;
  fluxo_out: number;
  categoria: string;
}

interface FlowData {
  volume?: number;
  outflow?: number;
  [key: string]: any;
}

// Mock function to simulate FastAPI backend analysis
const fetchFlowAnalysis = async (flowData: FlowData[]): Promise<FlowAnalysisData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock analysis data based on flow data
  return flowData.map(flow => ({
    fluxo_in: flow.volume || 0,
    fluxo_out: flow.outflow || 0,
    categoria: determineCategory(flow.volume || 0, flow.outflow || 0)
  }));
};

// Helper function to determine category based on flow data
const determineCategory = (volumeIn: number, volumeOut: number): string => {
  const netFlow = volumeIn - volumeOut;
  const flowRatio = volumeIn > 0 ? volumeOut / volumeIn : 0;
  
  if (netFlow > 1000000) return 'high-inflow';
  if (netFlow < -1000000) return 'high-outflow';
  if (flowRatio > 0.8) return 'balanced';
  if (volumeIn > volumeOut) return 'accumulation';
  if (volumeOut > volumeIn) return 'distribution';
  return 'neutral';
};

export const useFlowAnalysis = (flowData: FlowData[] | undefined) => {
  return useQuery({
    queryKey: ['flow-analysis', flowData],
    queryFn: () => fetchFlowAnalysis(flowData || []),
    enabled: !!flowData && flowData.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // 30 seconds
  });
};