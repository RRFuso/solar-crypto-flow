
import * as d3 from 'd3';
import { NarrativeData, NarrativeNode } from '@/types/narratives';
import { useMarketAttention } from './useMarketAttention';
import { getLogoUrls } from '@/lib/cryptoLogos';

export const useNodeSizing = (narratives: NarrativeData[]) => {
  const { applyAttentionScoresToNodes } = useMarketAttention();
  
  // Create nodes from narrative data
  const createNodes = (flowData: any[]): NarrativeNode[] => {
    const nodes: NarrativeNode[] = [];
    const uniqueNarratives = new Set();
    
    flowData.forEach(flow => {
      const sourceNarrative = narratives.find(n => n.id === flow.from);
      const targetNarrative = narratives.find(n => n.id === flow.to);
      
      if (!sourceNarrative || !targetNarrative) return;
      
      if (!uniqueNarratives.has(flow.from)) {
        uniqueNarratives.add(flow.from);
        nodes.push({ 
          id: flow.from,
          name: sourceNarrative.name,
          value: sourceNarrative.marketCap,
          color: sourceNarrative.color,
          tokens: sourceNarrative.tokens,
          representativeTokens: sourceNarrative.representativeTokens || 
            sourceNarrative.tokens.slice(0, 3).map(symbol => ({
              symbol,
              name: symbol,
              logoUrl: getLogoUrls(symbol)[0]
            })),
          x: 0,
          y: 0,
          radius: 0,
          fx: null,
          fy: null
        });
      }
      
      if (!uniqueNarratives.has(flow.to)) {
        uniqueNarratives.add(flow.to);
        nodes.push({ 
          id: flow.to,
          name: targetNarrative.name,
          value: targetNarrative.marketCap,
          color: targetNarrative.color,
          tokens: targetNarrative.tokens,
          representativeTokens: targetNarrative.representativeTokens || 
            targetNarrative.tokens.slice(0, 3).map(symbol => ({
              symbol,
              name: symbol,
              logoUrl: getLogoUrls(symbol)[0]
            })),
          x: 0,
          y: 0,
          radius: 0,
          fx: null,
          fy: null
        });
      }
    });

    // Apply market attention scores to nodes
    return applyAttentionScoresToNodes(nodes, narratives);
  };

  // Scale node sizes based on market cap and attention
  const scaleNodeSizes = (nodes: NarrativeNode[]) => {
    if (nodes.length === 0) return nodes;
    
    // Adjust size for logos
    const minRadius = 50; 
    const maxRadius = 90;
    const marketCapExtent = d3.extent(nodes, d => d.value);
    
    nodes.forEach(node => {
      // Base size on market cap
      const baseRadius = marketCapExtent[0] === marketCapExtent[1] 
        ? minRadius 
        : d3.scaleLinear()
            .domain([marketCapExtent[0], marketCapExtent[1]])
            .range([minRadius, maxRadius])(node.value);
      
      // Attention boost (up to 20% larger)
      const attentionBoost = node.attentionScore 
        ? 1 + (node.attentionScore / 100) * 0.2 
        : 1;
      
      node.radius = baseRadius * attentionBoost;

      // Ensure each node has representativeTokens with better logo URLs
      if (!node.representativeTokens || node.representativeTokens.length === 0) {
        node.representativeTokens = node.tokens.slice(0, 3).map(symbol => ({
          symbol,
          name: symbol,
          logoUrl: getLogoUrls(symbol)[0]
        }));
      } else {
        // Update existing logo URLs to use better sources
        node.representativeTokens = node.representativeTokens.map(token => ({
          ...token,
          logoUrl: getLogoUrls(token.symbol)[0]
        }));
      }
    });

    return nodes;
  };

  return {
    createNodes,
    scaleNodeSizes
  };
};
