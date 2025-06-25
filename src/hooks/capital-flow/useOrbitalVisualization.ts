
import { useCallback } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { OrbitalNode } from '@/components/capital-flow/NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

export const useOrbitalVisualization = () => {
  const createOrbitalVisualization = useCallback((
    flowData: FlowData[],
    svgElement: SVGSVGElement,
    width: number,
    height: number
  ) => {
    // Create D3 selection
    const svg = d3.select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);
    
    // Clear previous SVG content
    svg.selectAll("*").remove();
    
    // Extract unique assets for nodes
    const assets = Array.from(new Set([
      ...flowData.map(d => d.from),
      ...flowData.map(d => d.to)
    ]));
    
    // Compute total volume per asset to determine market cap if not provided
    const assetVolumes = new Map<string, number>();
    
    flowData.forEach(flow => {
      const fromVolume = assetVolumes.get(flow.from) || 0;
      assetVolumes.set(flow.from, fromVolume + (flow.volume || 0));
      
      const toVolume = assetVolumes.get(flow.to) || 0;
      assetVolumes.set(flow.to, toVolume + (flow.volume || 0));
    });
    
    // Create nodes with better orbital positioning
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;
    
    // Sort assets by volume for better orbital arrangement
    const sortedAssets = assets.sort((a, b) => {
      const volumeA = assetVolumes.get(a) || 0;
      const volumeB = assetVolumes.get(b) || 0;
      return volumeB - volumeA;
    });
    
    const nodes = sortedAssets.map((id, index) => {
      const marketCap = flowData.find(d => d.from === id || d.to === id)?.marketCap || 
                        assetVolumes.get(id) || 1;
      
      const isBTC = id === 'BTC';
      
      // Create multiple orbital layers for better distribution
      const totalNodes = sortedAssets.length;
      let orbitRadius, angle;
      
      if (isBTC) {
        // Central position for BTC
        return {
          id,
          marketCap,
          radius: 45,
          type: "central" as const,
          x: centerX,
          y: centerY
        };
      } else {
        // Distribute other nodes in orbital layers
        const nodeIndex = index - 1; // Subtract 1 for BTC
        const nodesPerOrbit = 8;
        const orbitLayer = Math.floor(nodeIndex / nodesPerOrbit);
        const nodeInOrbit = nodeIndex % nodesPerOrbit;
        
        orbitRadius = 120 + (orbitLayer * 80); // Multiple orbital layers
        angle = (nodeInOrbit / nodesPerOrbit) * 2 * Math.PI;
        
        // Add some randomness for more natural positioning
        const radiusVariation = (Math.random() - 0.5) * 20;
        const angleVariation = (Math.random() - 0.5) * 0.3;
        
        const finalRadius = Math.min(orbitRadius + radiusVariation, maxRadius);
        const finalAngle = angle + angleVariation;
        
        return {
          id,
          marketCap,
          radius: Math.max(20, Math.min(35, 20 + (marketCap / 10000))),
          type: "orbital" as const,
          x: centerX + Math.cos(finalAngle) * finalRadius,
          y: centerY + Math.sin(finalAngle) * finalRadius
        };
      }
    });
    
    // Create links but don't render them as blue lines
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      volume: flow.volume,
      percentage: flow.percentage
    })).filter(link => link.source && link.target) as OrbitalLink[];
    
    // Don't render the blue lines - let the LinkRenderer handle the dotted flow lines
    
    return {
      svg,
      width,
      height,
      nodes,
      links,
      centralNode: nodes.find(n => n.type === "central") || nodes[0]
    };
  }, []);

  return { createOrbitalVisualization };
};
