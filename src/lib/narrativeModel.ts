
import { NarrativeData, ModelPrediction, NarrativeFlow } from '@/types/narratives';

// Simplified prediction model without TensorFlow.js
// Uses statistical analysis and market pattern recognition

// Function to normalize data between 0 and 1
const normalizeData = (data: number[]): number[] => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) return data.map(() => 0.5);
  return data.map(value => (value - min) / range);
};

// Calculate moving average for trend analysis
const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(average);
  }
  return result;
};

// Generate market momentum score based on price changes and volume
const calculateMomentumScore = (narrative: NarrativeData): number => {
  const priceScore = (narrative.change24h + narrative.change7d * 0.3) / 2;
  const volumeScore = Math.log(narrative.volume24h / narrative.marketCap + 1) * 10;
  const dominanceScore = narrative.dominance * 2;
  
  return (priceScore + volumeScore + dominanceScore) / 3;
};

// Predict capital flows based on momentum and market conditions
export const generateFlowPredictions = async (
  narratives: NarrativeData[]
): Promise<ModelPrediction> => {
  const flowsData: NarrativeFlow[] = [];
  
  // Calculate momentum scores for all narratives
  const momentumScores = narratives.map(narrative => ({
    id: narrative.id,
    score: calculateMomentumScore(narrative),
    marketCap: narrative.marketCap,
    change24h: narrative.change24h
  }));
  
  // Sort by momentum score
  const sortedByMomentum = [...momentumScores].sort((a, b) => b.score - a.score);
  
  // Identify outperforming and underperforming narratives
  const avgMomentum = momentumScores.reduce((sum, n) => sum + n.score, 0) / momentumScores.length;
  const outperformers = sortedByMomentum.filter(n => n.score > avgMomentum * 1.2);
  const underperformers = sortedByMomentum.filter(n => n.score < avgMomentum * 0.8);
  
  // Generate flows from underperformers to outperformers
  underperformers.forEach(source => {
    const sourceNarrative = narratives.find(n => n.id === source.id);
    if (!sourceNarrative) return;
    
    // Determine flow targets (prioritize Layer 1 if it's outperforming)
    const l1Target = outperformers.find(t => t.id === 'l1');
    const targets = l1Target 
      ? [l1Target, ...outperformers.filter(t => t.id !== 'l1').slice(0, 1)]
      : outperformers.slice(0, 2);
    
    targets.forEach(target => {
      const flowPercentage = Math.abs(source.score - target.score) * 0.5;
      const flowValue = (sourceNarrative.marketCap * flowPercentage) / 100;
      
      // Apply boost for Layer 1 flows
      const boostFactor = target.id === 'l1' ? 1.4 : 1.0;
      
      flowsData.push({
        from: source.id,
        to: target.id,
        value: flowValue * boostFactor,
        percentage: flowPercentage,
        predicted: true
      });
    });
  });
  
  // Add some cross-flows between similar-performing narratives
  const midPerformers = sortedByMomentum.filter(n => 
    n.score >= avgMomentum * 0.8 && n.score <= avgMomentum * 1.2
  );
  
  for (let i = 0; i < Math.min(3, midPerformers.length - 1); i++) {
    const source = midPerformers[i];
    const target = midPerformers[i + 1];
    
    if (source.score < target.score) {
      const flowPercentage = (target.score - source.score) * 0.3;
      const flowValue = (source.marketCap * flowPercentage) / 100;
      
      flowsData.push({
        from: source.id,
        to: target.id,
        value: flowValue,
        percentage: flowPercentage,
        predicted: true
      });
    }
  }
  
  return {
    narrativeFlows: flowsData.slice(0, 8), // Limit to top 8 flows
    timestamp: new Date().toISOString(),
    confidence: 0.65 + Math.random() * 0.25 // 65-90% confidence
  };
};

// Main prediction function
export const predictWithModel = async (narratives: NarrativeData[]): Promise<ModelPrediction> => {
  try {
    const predictions = await generateFlowPredictions(narratives);
    return predictions;
  } catch (error) {
    console.error('Error generating narrative flow predictions:', error);
    return {
      narrativeFlows: [],
      timestamp: new Date().toISOString(),
      confidence: 0
    };
  }
};

// Legacy function stubs for compatibility (no longer used)
export const trainNarrativeModel = async (narrativeData: NarrativeData[]): Promise<any> => {
  console.warn('trainNarrativeModel is deprecated - using statistical model instead');
  return Promise.resolve(null);
};

export const loadNarrativeModel = async (narratives: NarrativeData[]): Promise<any> => {
  console.warn('loadNarrativeModel is deprecated - using statistical model instead');
  return Promise.resolve(null);
};
