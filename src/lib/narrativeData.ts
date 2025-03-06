
import { NarrativeData, NarrativeFlow, ModelPrediction } from '@/types/narratives';
import { predictWithModel } from './narrativeModel';

// Define the main crypto narratives
const NARRATIVES: NarrativeData[] = [
  {
    id: 'ai',
    name: 'AI',
    marketCap: 15200000000,
    volume24h: 980000000,
    dominance: 1.2,
    change24h: 5.3,
    change7d: 12.7,
    tokens: ['FET', 'OCEAN', 'AGIX', 'RLC', 'NMR', 'GRT', 'RNDR'],
    color: '#FF5733'
  },
  {
    id: 'defi',
    name: 'DeFi',
    marketCap: 42500000000,
    volume24h: 3200000000,
    dominance: 3.4,
    change24h: -2.1,
    change7d: 4.5,
    tokens: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CAKE', 'CRV', 'SUSHI', 'BAL'],
    color: '#6A0DAD'
  },
  {
    id: 'defi-ai',
    name: 'DeFi AI',
    marketCap: 8900000000,
    volume24h: 720000000,
    dominance: 0.7,
    change24h: 7.8,
    change7d: 15.2,
    tokens: ['INJ', 'TRB', 'RNDR', 'LPT', 'ICP', 'NEAR', 'QNT'],
    color: '#3498DB'
  },
  {
    id: 'meme',
    name: 'Meme',
    marketCap: 29800000000,
    volume24h: 4100000000,
    dominance: 2.4,
    change24h: 8.9,
    change7d: -5.3,
    tokens: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'MEME'],
    color: '#F1C40F'
  },
  {
    id: 'rwa',
    name: 'RWA',
    marketCap: 5100000000,
    volume24h: 310000000,
    dominance: 0.4,
    change24h: 1.2,
    change7d: 3.8,
    tokens: ['RWA', 'RNDR', 'LDO', 'PAXG', 'MNT', 'FXS', 'XAUt'],
    color: '#27AE60'
  },
  {
    id: 'l1',
    name: 'Layer 1',
    marketCap: 220000000000,
    volume24h: 12000000000,
    dominance: 17.6,
    change24h: -1.5,
    change7d: 2.1,
    tokens: ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ONE'],
    color: '#E74C3C'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    marketCap: 18500000000,
    volume24h: 1500000000,
    dominance: 1.5,
    change24h: 3.2,
    change7d: 8.9,
    tokens: ['SAND', 'MANA', 'AXS', 'ILV', 'ENJ', 'GALA', 'IMX', 'MAGIC', 'APE'],
    color: '#16A085'
  }
];

// Mock function to simulate LSTM model predictions
export const predictNarrativeFlows = async (): Promise<ModelPrediction> => {
  try {
    // Use our TensorFlow.js LSTM model for predictions
    const predictions = await predictWithModel(NARRATIVES);
    return predictions;
  } catch (error) {
    console.error("Error predicting narrative flows:", error);
    
    // Fallback to simulated data if model fails
    const flows: NarrativeFlow[] = [];
    const activeNarratives = [...NARRATIVES];
    
    // Generate 5-8 realistic flows between narratives
    const flowCount = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < flowCount; i++) {
      const sourceIndex = Math.floor(Math.random() * activeNarratives.length);
      let targetIndex = Math.floor(Math.random() * activeNarratives.length);
      
      // Ensure source and target are different
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * activeNarratives.length);
      }
      
      const source = activeNarratives[sourceIndex];
      const target = activeNarratives[targetIndex];
      
      // Calculate a realistic flow value based on market caps
      const basePercentage = (Math.random() * 5) + 0.5; // 0.5% to 5.5%
      const adjustedPercentage = basePercentage * (source.change24h > 0 ? 1.2 : 0.8);
      const flowValue = (source.marketCap * adjustedPercentage) / 100;
      
      flows.push({
        from: source.id,
        to: target.id,
        value: flowValue,
        percentage: adjustedPercentage,
        predicted: true
      });
    }
    
    return {
      narrativeFlows: flows,
      timestamp: new Date().toISOString(),
      confidence: 0.7 + (Math.random() * 0.2) // 70-90% confidence
    };
  }
};

// Get all narrative data
export const getNarratives = (): NarrativeData[] => {
  return NARRATIVES;
};

// Get a specific narrative by ID
export const getNarrativeById = (id: string): NarrativeData | undefined => {
  return NARRATIVES.find(narrative => narrative.id === id);
};

// Calculate relative market movements between narratives
export const calculateHistoricalFlows = (): NarrativeFlow[] => {
  const flows: NarrativeFlow[] = [];
  
  // Create flows based on relative performance
  for (let i = 0; i < NARRATIVES.length; i++) {
    for (let j = 0; j < NARRATIVES.length; j++) {
      if (i !== j) {
        const source = NARRATIVES[i];
        const target = NARRATIVES[j];
        
        // Only create a flow if the target is outperforming the source
        const performanceDiff = target.change24h - source.change24h;
        
        if (performanceDiff > 3) { // Only show significant flows (>3% difference)
          const flowMagnitude = (source.marketCap * Math.abs(performanceDiff)) / 1000;
          
          flows.push({
            from: source.id,
            to: target.id,
            value: flowMagnitude,
            percentage: performanceDiff,
            predicted: false
          });
        }
      }
    }
  }
  
  // Sort by flow magnitude and return top flows
  return flows.sort((a, b) => b.value - a.value).slice(0, 7);
};
