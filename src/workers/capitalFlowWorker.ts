// Capital Flow Web Worker - Processes market data in background thread

interface FlowData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  flowDirection: 'inflow' | 'outflow' | 'neutral';
  flowIntensity: number;
}

interface RawFlowData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  flowDirection?: 'inflow' | 'outflow' | 'neutral';
  flowIntensity?: number;
}

interface ProcessingResult {
  type: 'processed' | 'error' | 'progress';
  data?: FlowData[];
  progress?: number;
  error?: string;
  stats?: {
    totalProcessed: number;
    inflowCount: number;
    outflowCount: number;
    processingTime: number;
  };
}

// Calculate flow direction based on price change and volume
function calculateFlowDirection(change24h: number, volume: number, avgVolume: number): 'inflow' | 'outflow' | 'neutral' {
  const volumeRatio = volume / avgVolume;
  
  if (change24h > 2 && volumeRatio > 1.5) return 'inflow';
  if (change24h < -2 && volumeRatio > 1.5) return 'outflow';
  if (change24h > 0.5) return 'inflow';
  if (change24h < -0.5) return 'outflow';
  return 'neutral';
}

// Calculate flow intensity (0-100)
function calculateFlowIntensity(change24h: number, volume: number, marketCap: number): number {
  const volumeToMcap = (volume / marketCap) * 100;
  const changeImpact = Math.abs(change24h) * 2;
  const volumeImpact = Math.min(volumeToMcap * 10, 50);
  
  return Math.min(Math.round(changeImpact + volumeImpact), 100);
}

// Sort and rank flows by significance
function rankFlows(flows: FlowData[]): FlowData[] {
  return flows.sort((a, b) => {
    const scoreA = (a.flowIntensity || 0) * (a.flowDirection === 'inflow' ? 1 : -1);
    const scoreB = (b.flowIntensity || 0) * (b.flowDirection === 'inflow' ? 1 : -1);
    return Math.abs(scoreB) - Math.abs(scoreA);
  });
}

// Filter flows by category
function filterByCategory(flows: FlowData[], category: string): FlowData[] {
  if (category === 'all') return flows;
  
  const categoryPatterns: Record<string, string[]> = {
    'defi': ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CRV', 'SUSHI', 'YFI', 'LINK'],
    'layer1': ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM'],
    'layer2': ['MATIC', 'ARB', 'OP', 'IMX', 'LRC', 'METIS'],
    'gaming': ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'IMX', 'ILV'],
    'meme': ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF'],
  };
  
  const symbols = categoryPatterns[category] || [];
  return flows.filter(f => symbols.includes(f.symbol.toUpperCase()));
}

// Main processing function
function processFlowData(
  rawData: RawFlowData[],
  options: {
    category?: string;
    limit?: number;
    minVolume?: number;
  } = {}
): ProcessingResult {
  const startTime = performance.now();
  
  try {
    const { category = 'all', limit = 50, minVolume = 0 } = options;
    
    // Calculate average volume for reference
    const avgVolume = rawData.reduce((sum, d) => sum + (d.volume || 0), 0) / rawData.length;
    
    // Process each flow
    let processed = rawData
      .filter(d => (d.volume || 0) >= minVolume)
      .map(flow => ({
        ...flow,
        flowDirection: calculateFlowDirection(flow.change24h || 0, flow.volume || 0, avgVolume),
        flowIntensity: calculateFlowIntensity(flow.change24h || 0, flow.volume || 0, flow.marketCap || 1),
      }));
    
    // Filter by category
    processed = filterByCategory(processed, category);
    
    // Rank and limit
    processed = rankFlows(processed).slice(0, limit);
    
    const endTime = performance.now();
    
    return {
      type: 'processed',
      data: processed,
      stats: {
        totalProcessed: processed.length,
        inflowCount: processed.filter(f => f.flowDirection === 'inflow').length,
        outflowCount: processed.filter(f => f.flowDirection === 'outflow').length,
        processingTime: Math.round(endTime - startTime),
      },
    };
  } catch (error) {
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown processing error',
    };
  }
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'process':
      const result = processFlowData(payload.data, payload.options);
      self.postMessage(result);
      break;
      
    case 'ping':
      self.postMessage({ type: 'pong' });
      break;
      
    default:
      self.postMessage({ type: 'error', error: `Unknown message type: ${type}` });
  }
};

export {};
