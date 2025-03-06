
import * as d3 from 'd3';
import { NarrativeData, NarrativeNode } from '@/types/narratives';

export const useNodeSizing = (narratives: NarrativeData[]) => {
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
          x: 0,
          y: 0,
          radius: 0,
          fx: null,
          fy: null
        });
      }
    });

    return nodes;
  };

  // Scale node sizes based on market cap
  const scaleNodeSizes = (nodes: NarrativeNode[]) => {
    if (nodes.length === 0) return nodes;
    
    // Increase minimum radius to accommodate multiple logos
    const minRadius = 50;
    const maxRadius = 90;
    const marketCapExtent = d3.extent(nodes, d => d.value);
    
    nodes.forEach(node => {
      node.radius = marketCapExtent[0] === marketCapExtent[1] 
        ? minRadius 
        : d3.scaleLinear()
            .domain([marketCapExtent[0], marketCapExtent[1]])
            .range([minRadius, maxRadius])(node.value);
    });

    return nodes;
  };

  return {
    createNodes,
    scaleNodeSizes
  };
};
