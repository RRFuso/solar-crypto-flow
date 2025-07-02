
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

// Mock capital flow data generator
const generateMockFlowData = (timeframe: string): FlowData[] => {
  const cryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE'];
  const flows: FlowData[] = [];
  
  for (let i = 0; i < 20; i++) {
    const from = cryptos[Math.floor(Math.random() * cryptos.length)];
    let to = cryptos[Math.floor(Math.random() * cryptos.length)];
    while (to === from) {
      to = cryptos[Math.floor(Math.random() * cryptos.length)];
    }
    
    flows.push({
      from,
      to,
      value: Math.random() * 1000000000,
      percentage: Math.random() * 10,
      volume: Math.random() * 500000000,
      price: Math.random() * 50000,
      previousPrice: Math.random() * 48000,
      category: ['DeFi', 'Layer1', 'Gaming', 'AI'][Math.floor(Math.random() * 4)]
    });
  }
  
  return flows;
};

export const fetchCapitalFlowData = async (timeframe: string = '4h'): Promise<FlowData[]> => {
  try {
    // For now, return mock data
    return generateMockFlowData(timeframe);
  } catch (error) {
    console.error("Error fetching capital flow data:", error);
    return generateMockFlowData(timeframe);
  }
};

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
