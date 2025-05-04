
import { FlowData } from '@/types/crypto';

interface FlowAnalysisInput {
  fluxo_in: number;
  fluxo_out: number;
  preco: number;
  preco_anterior: number;
  volume: number;
  gas_fees?: number;
  dex_activity?: number;
}

interface FlowAnalysisOutput extends FlowAnalysisInput {
  categoria: string;
}

export const fetchFlowAnalysis = async (flowData: FlowData[]): Promise<FlowAnalysisOutput[]> => {
  try {
    // Transform FlowData to the format expected by the API
    const flowAnalysisInput: FlowAnalysisInput[] = flowData.map(flow => ({
      fluxo_in: flow.volume || 0,
      fluxo_out: flow.outflow || 0,
      preco: flow.price || 0,
      preco_anterior: flow.previousPrice || 0,
      volume: flow.volume || 0,
      gas_fees: flow.gasFees || 0,
      dex_activity: flow.dexActivity || 0
    }));
    
    // Fetch from API
    const response = await fetch("http://localhost:8000/flow-analysis/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flowAnalysisInput),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching flow analysis:", error);
    // Return original data without categories as fallback
    return flowData.map(flow => ({
      fluxo_in: flow.volume || 0,
      fluxo_out: flow.outflow || 0,
      preco: flow.price || 0,
      preco_anterior: flow.previousPrice || 0,
      volume: flow.volume || 0,
      categoria: "Neutro"
    }));
  }
};
