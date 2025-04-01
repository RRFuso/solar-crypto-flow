
import { MarketIndex, IndexFlowData, IndexRotationResult } from '@/types/indices';

// Market indices with their symbols
const marketIndices: MarketIndex[] = [
  { id: 'SP500', name: 'S&P 500', symbol: '^GSPC', color: '#8884d8' },
  { id: 'NASDAQ', name: 'Nasdaq', symbol: '^IXIC', color: '#82ca9d' },
  { id: 'DOW', name: 'Dow Jones', symbol: '^DJI', color: '#ffc658' },
  { id: 'RUSSELL', name: 'Russell 2000', symbol: '^RUT', color: '#ff8042' },
  { id: 'GOLD', name: 'Gold', symbol: 'GC=F', color: '#FFD700' }
];

// Mock data for development purposes
const mockHistoricalData = {
  'SP500': [9950, 10000, 10050, 10100, 10150, 10200, 10250],
  'NASDAQ': [14900, 15000, 15100, 15050, 15000, 15200, 15300],
  'DOW': [34800, 35000, 35100, 35050, 35000, 34900, 35100],
  'RUSSELL': [1990, 2000, 2010, 2020, 2000, 1980, 1970],
  'GOLD': [1890, 1900, 1910, 1920, 1930, 1940, 1950]
};

// Calculate percentage changes
function calculatePercentageChanges(data: Record<string, number[]>): Record<string, number[]> {
  const percentageChanges: Record<string, number[]> = {};
  
  for (const [index, values] of Object.entries(data)) {
    percentageChanges[index] = [];
    for (let i = 1; i < values.length; i++) {
      const change = ((values[i] - values[i-1]) / values[i-1]) * 100;
      percentageChanges[index].push(Number(change.toFixed(2)));
    }
  }
  
  return percentageChanges;
}

// Detect capital flows between indices
function detectCapitalFlows(percentageChanges: Record<string, number[]>): IndexFlowData[] {
  const flows: IndexFlowData[] = [];
  const indices = Object.keys(percentageChanges);
  const latestChanges: Record<string, number> = {};
  
  // Get latest percentage change for each index
  indices.forEach(index => {
    const changes = percentageChanges[index];
    latestChanges[index] = changes[changes.length - 1];
  });
  
  // Sort indices by performance
  const sortedIndices = indices.sort((a, b) => latestChanges[b] - latestChanges[a]);
  
  // Create flows from worst performers to best performers
  for (let i = sortedIndices.length - 1; i > 0; i--) {
    const fromIndex = sortedIndices[i];
    const toIndex = sortedIndices[0]; // Best performer
    
    if (latestChanges[fromIndex] < 0 && latestChanges[toIndex] > 0) {
      flows.push({
        from: fromIndex,
        to: toIndex,
        value: Math.abs(latestChanges[fromIndex]) * 10, // Scale for visualization
        percentage: latestChanges[toIndex] - latestChanges[fromIndex]
      });
    }
  }
  
  // If no negative performers, detect flows between weaker and stronger positive performers
  if (flows.length === 0) {
    for (let i = sortedIndices.length - 1; i > 0; i--) {
      const fromIndex = sortedIndices[i];
      const toIndex = sortedIndices[0];
      
      if (latestChanges[toIndex] > latestChanges[fromIndex]) {
        flows.push({
          from: fromIndex,
          to: toIndex,
          value: (latestChanges[toIndex] - latestChanges[fromIndex]) * 5, // Scale for visualization
          percentage: latestChanges[toIndex] - latestChanges[fromIndex]
        });
      }
    }
  }
  
  return flows;
}

// Main function to fetch and analyze market data
export async function fetchMarketRotationData(period: string = '7d'): Promise<IndexRotationResult> {
  // In a real implementation, this would fetch data from an API
  // For now, using mock data
  
  // Update mock indices with latest values and changes
  const updatedIndices = marketIndices.map(index => {
    const values = mockHistoricalData[index.id];
    const latestValue = values[values.length - 1];
    const previousValue = values[values.length - 2];
    const change = ((latestValue - previousValue) / previousValue) * 100;
    
    return {
      ...index,
      value: latestValue,
      change: Number(change.toFixed(2))
    };
  });
  
  // Calculate percentage changes for analysis
  const percentageChanges = calculatePercentageChanges(mockHistoricalData);
  
  // Detect capital flows
  const flows = detectCapitalFlows(percentageChanges);
  
  return {
    indices: updatedIndices,
    flows,
    timestamp: new Date().toISOString(),
    period
  };
}
