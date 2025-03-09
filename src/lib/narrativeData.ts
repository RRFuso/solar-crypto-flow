import { NarrativeData, NarrativeFlow, ModelPrediction, RepresentativeToken } from '@/types/narratives';
import { predictWithModel } from './narrativeModel';

// Define representative tokens with their logo URLs - use consistent method
const getRepresentativeTokens = (symbols: string[]): RepresentativeToken[] => {
  return symbols.map(symbol => ({
    symbol,
    name: symbol,
    logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/1.png` // Default that will be replaced by context
  }));
};

// Define the main crypto narratives
const NARRATIVES: NarrativeData[] = [
  {
    id: 'ai',
    name: 'AI',
    marketCap: 15200000000,
    volume24h: 980000000,
    dominance: 1.2,
    change24h: 2.3, // Reduced performance
    change7d: 5.7,  // Reduced performance
    tokens: ['FET', 'OCEAN', 'AGIX', 'RLC', 'NMR', 'GRT', 'RNDR'],
    representativeTokens: getRepresentativeTokens(['FET', 'OCEAN', 'AGIX']),
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
    representativeTokens: getRepresentativeTokens(['UNI', 'AAVE', 'MKR']),
    color: '#6A0DAD'
  },
  {
    id: 'defi-ai',
    name: 'DeFi AI',
    marketCap: 8900000000,
    volume24h: 720000000,
    dominance: 0.7,
    change24h: 3.8, // Reduced performance
    change7d: 9.2,  // Reduced performance
    tokens: ['INJ', 'TRB', 'RNDR', 'LPT', 'ICP', 'NEAR', 'QNT'],
    representativeTokens: getRepresentativeTokens(['INJ', 'TRB', 'RNDR']),
    color: '#3498DB'
  },
  {
    id: 'meme',
    name: 'Meme',
    marketCap: 29800000000,
    volume24h: 4100000000,
    dominance: 2.4,
    change24h: 1.9, // Reduced performance
    change7d: -5.3,
    tokens: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'MEME'],
    representativeTokens: getRepresentativeTokens(['DOGE', 'SHIB', 'PEPE']),
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
    representativeTokens: getRepresentativeTokens(['PAXG', 'MNT', 'FXS']),
    color: '#27AE60'
  },
  {
    id: 'l1',
    name: 'Layer 1',
    marketCap: 220000000000,
    volume24h: 12000000000,
    dominance: 17.6,
    change24h: 4.5, // Improved performance to reflect current market
    change7d: 7.1, // Improved performance to reflect current market
    tokens: ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ONE'],
    representativeTokens: getRepresentativeTokens(['ETH', 'SOL', 'ADA']),
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
    representativeTokens: getRepresentativeTokens(['AXS', 'MANA', 'SAND']),
    color: '#16A085'
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    marketCap: 1700000000000,
    volume24h: 25000000000,
    dominance: 52.5,
    change24h: 2.2, // Moderate positive change
    change7d: 2.9,
    tokens: ['BTC'],
    representativeTokens: getRepresentativeTokens(['BTC']),
    color: '#F7931A'
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
  
  // Find Layer 1 narrative
  const l1Narrative = NARRATIVES.find(n => n.id === 'l1');
  
  // Create flows based on relative performance
  for (let i = 0; i < NARRATIVES.length; i++) {
    for (let j = 0; j < NARRATIVES.length; j++) {
      if (i !== j) {
        const source = NARRATIVES[i];
        const target = NARRATIVES[j];
        
        // Only create a flow if the target is outperforming the source
        const performanceDiff = target.change24h - source.change24h;
        
        if (performanceDiff > 2) { // Lower threshold for more flows (was 3)
          // Calculate flow magnitude based on the market cap difference and performance difference
          const flowMagnitude = (source.marketCap * Math.abs(performanceDiff)) / 1000;
          
          // Priority boost for flows into L1 when L1 is performing well
          let boostFactor = 1.0;
          if (target.id === 'l1' && l1Narrative && l1Narrative.change24h > 3.0) {
            boostFactor = 1.5; // Boost flows into L1
          }
          
          flows.push({
            from: source.id,
            to: target.id,
            value: flowMagnitude * boostFactor,
            percentage: performanceDiff,
            predicted: false
          });
        }
      }
    }
  }
  
  // Specifically add flows from underperforming sectors to Layer 1 if L1 is doing well
  if (l1Narrative && l1Narrative.change24h > 3.0) {
    const underperformers = NARRATIVES.filter(n => 
      n.id !== 'l1' && 
      n.id !== 'btc' && 
      n.change24h < l1Narrative.change24h * 0.5
    );
    
    underperformers.forEach(source => {
      const performanceDiff = l1Narrative.change24h - source.change24h;
      const flowValue = (source.marketCap * performanceDiff) / 500; // Stronger flow
      
      flows.push({
        from: source.id,
        to: 'l1',
        value: flowValue,
        percentage: performanceDiff,
        predicted: false
      });
    });
  }
  
  // Sort by flow magnitude and return top flows
  return flows.sort((a, b) => b.value - a.value).slice(0, 9); // Increased from 7 to 9
};

// Get market attention metrics for narratives
export const getMarketAttentionData = () => {
  // Calculate which narratives are receiving the most attention
  const attentionScores: Record<string, number> = {};
  
  NARRATIVES.forEach(narrative => {
    // Formula: (volume24h / marketCap) * (1 + Math.abs(change24h/100)) * dominance
    let attentionScore = 
      (narrative.volume24h / narrative.marketCap) * 
      (1 + Math.abs(narrative.change24h / 100)) * 
      narrative.dominance;
    
    // Boost for Layer 1 attention based on current market conditions
    if (narrative.id === 'l1') {
      attentionScore *= 1.3; // 30% boost for Layer 1
    }
    
    attentionScores[narrative.id] = attentionScore;
  });
  
  // Sort narratives by attention score
  const sortedNarratives = [...NARRATIVES]
    .sort((a, b) => attentionScores[b.id] - attentionScores[a.id]);
  
  return {
    attentionScores,
    topNarratives: sortedNarratives.slice(0, 3),
    btcAttention: attentionScores['btc'] || 0
  };
};
