
import { FlowData } from '@/types/crypto';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Interface matching the backend Fluxo model
 */
interface FluxoData {
  ativo: string;
  fluxo_in: number;
  fluxo_out: number;
  preco: number;
  preco_anterior: number;
  volume: number;
  gas_fees?: number;
  dex_activity?: number;
}

/**
 * Interface for the flow analysis response
 */
interface FlowAnalysisResponse extends FluxoData {
  categoria: string;
}

/**
 * Convert our app's FlowData to the backend's FluxoData format
 */
const convertToFluxoData = (flow: FlowData): FluxoData => {
  return {
    ativo: flow.from + '-' + flow.to,
    fluxo_in: flow.value * (flow.percentage > 0 ? 1 : 0),
    fluxo_out: flow.value * (flow.percentage < 0 ? 1 : 0),
    preco: flow.price || 0,
    preco_anterior: flow.previousPrice || 0,
    volume: flow.volume || 0,
    gas_fees: flow.gasFees,
    dex_activity: flow.dexActivity
  };
};

/**
 * Convert the backend's FlowAnalysisResponse to our app's FlowData format
 */
const convertToFlowData = (response: FlowAnalysisResponse): FlowData => {
  const flowParts = response.ativo.split('-');
  return {
    id: `flow-${response.ativo}-${Date.now()}`,
    from: flowParts[0],
    to: flowParts[1],
    value: response.fluxo_in > response.fluxo_out ? response.fluxo_in : response.fluxo_out,
    percentage: response.fluxo_in > response.fluxo_out ? 1 : -1,
    price: response.preco,
    previousPrice: response.preco_anterior,
    volume: response.volume,
    gasFees: response.gas_fees,
    dexActivity: response.dex_activity,
    category: response.categoria
  };
};

/**
 * Send flow data to the backend for analysis
 */
export const analyzeFlows = async (flows: FlowData[]): Promise<FlowData[]> => {
  try {
    const fluxos = flows.map(convertToFluxoData);
    
    const response = await fetch(`${API_BASE_URL}/flow-analysis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fluxos),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as FlowAnalysisResponse[];
    return data.map(convertToFlowData);
  } catch (error) {
    console.error('Error analyzing flows:', error);
    // Return original flows on error
    return flows;
  }
};

/**
 * Get anomaly detection data
 */
export const detectAnomalies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/anomaly-detection`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return { status: 'error', labels: [] };
  }
};

/**
 * WebSocket connection for real-time updates
 */
export const createWebSocketConnection = (
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
) => {
  const socket = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  return {
    socket,
    close: () => socket.close(),
    send: (data: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    }
  };
};
