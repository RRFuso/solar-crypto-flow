
import { NarrativeData, NarrativeNode } from '@/types/narratives';

interface AttentionScores {
  [narrativeId: string]: number;
}

export const useMarketAttention = () => {
  // Calculate attention score based on volume, dominance and price changes
  const calculateAttentionScores = (narratives: NarrativeData[]): AttentionScores => {
    const scores: AttentionScores = {};
    
    // Find max values for normalization
    const maxVolume = Math.max(...narratives.map(n => n.volume24h));
    const maxChange = Math.max(...narratives.map(n => Math.abs(n.change24h)));
    
    narratives.forEach(narrative => {
      // Calculate normalized metrics (0-1 scale)
      const volumeScore = narrative.volume24h / maxVolume;
      const changeScore = Math.abs(narrative.change24h) / (maxChange || 1);
      const dominanceScore = narrative.dominance / 100;
      
      // Weighted score calculation 
      // Volume and recent price action are strong indicators of market attention
      const attentionScore = (
        volumeScore * 0.5 +         // 50% weight on trading volume
        changeScore * 0.3 +         // 30% weight on price volatility
        dominanceScore * 0.2        // 20% weight on market dominance
      ) * 100; // Scale to 0-100
      
      scores[narrative.id] = Number(attentionScore.toFixed(1));
    });
    
    return scores;
  };
  
  // Apply attention scores to nodes
  const applyAttentionScoresToNodes = (
    nodes: NarrativeNode[], 
    narratives: NarrativeData[]
  ): NarrativeNode[] => {
    const attentionScores = calculateAttentionScores(narratives);
    
    return nodes.map(node => ({
      ...node,
      attentionScore: attentionScores[node.id] || 0
    }));
  };
  
  // Get top narratives by attention
  const getTopNarrativesByAttention = (
    narratives: NarrativeData[], 
    limit: number = 3
  ): NarrativeData[] => {
    const attentionScores = calculateAttentionScores(narratives);
    
    return [...narratives]
      .sort((a, b) => (attentionScores[b.id] || 0) - (attentionScores[a.id] || 0))
      .slice(0, limit);
  };
  
  return {
    calculateAttentionScores,
    applyAttentionScoresToNodes,
    getTopNarrativesByAttention
  };
};
