
import { NarrativeFlow } from '@/types/narratives';
import { NARRATIVES } from './constants';

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
