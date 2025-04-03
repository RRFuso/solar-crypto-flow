
import { useCallback } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';

type OrbitalNode = {
  id: string;
  marketCap: number;
  radius: number;
  type: "central" | "orbital";
  x: number;
  y: number;
};

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
    containerElement: HTMLDivElement
  ) => {
    // Get width and height - ensuring sufficient height
    const width = containerElement.clientWidth;
    const height = Math.max(650, containerElement.clientHeight);
    
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
      // Sum volumes for both source and target nodes
      const fromVolume = assetVolumes.get(flow.from) || 0;
      assetVolumes.set(flow.from, fromVolume + (flow.volume || 0));
      
      const toVolume = assetVolumes.get(flow.to) || 0;
      assetVolumes.set(flow.to, toVolume + (flow.volume || 0));
    });
    
    // Create nodes with market cap (or volume) information
    const nodes = assets.map(id => {
      // Use marketCap if available in data, otherwise use the computed volume
      const marketCap = flowData.find(d => d.from === id || d.to === id)?.marketCap || 
                        assetVolumes.get(id) || 1;
      
      const isBTC = id === 'BTC';
      
      return {
        id,
        marketCap,
        radius: isBTC ? 45 : Math.max(20, Math.min(40, 20 + (marketCap / 1000))),
        type: isBTC ? "central" : "orbital",
        x: 0,
        y: 0
      };
    });
    
    // Find the node with the highest market cap to serve as the central node
    const centralNode = nodes.reduce((max, node) => 
      node.marketCap > max.marketCap ? node : max, 
      { ...nodes[0], marketCap: -Infinity });
    
    // Mark the central node
    centralNode.type = "central";
    centralNode.radius = 45; // Make central node bigger
    
    // Create links
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      volume: flow.volume,
      percentage: flow.percentage
    })).filter(link => link.source && link.target) as OrbitalLink[];
    
    return {
      svg,
      width,
      height,
      nodes,
      links,
      centralNode
    };
  }, []);

  return { createOrbitalVisualization };
};
