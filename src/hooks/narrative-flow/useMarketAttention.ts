
import { NarrativeData, NarrativeNode } from '@/types/narratives';

export const useMarketAttention = () => {
  // Apply market attention score to nodes
  const applyAttentionScoresToNodes = (nodes: NarrativeNode[], narratives: NarrativeData[]): NarrativeNode[] => {
    return nodes.map(node => {
      const narrative = narratives.find(n => n.id === node.id);
      if (!narrative) return node;
      
      // Calculate attention score based on multiple factors
      const volumeFactor = narrative.volume24h / 1000000; // Volume in millions
      const changeFactor = Math.abs(narrative.change24h) * 2; // Absolute price change
      const dominanceFactor = narrative.dominance * 10; // Market dominance
      
      // Special boost for Bitcoin narratives
      const isBitcoinNarrative = 
        narrative.name.toLowerCase().includes('bitcoin') || 
        narrative.tokens.includes('BTC');
      
      const bitcoinBoost = isBitcoinNarrative ? 20 : 0;
      
      // Calculate attention score (0-100)
      let attentionScore = Math.min(
        100, 
        Math.round(volumeFactor + changeFactor + dominanceFactor + bitcoinBoost)
      );
      
      // Ensure at least some attention for all narratives
      attentionScore = Math.max(10, attentionScore);
      
      return {
        ...node,
        attentionScore
      };
    });
  };

  return {
    applyAttentionScoresToNodes
  };
};
