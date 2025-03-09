
import { NARRATIVES } from './constants';

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
