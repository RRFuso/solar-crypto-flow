
import React, { useEffect, useRef } from 'react';
import { IndexRotationResult } from '@/types/indices';
import { useOrbitalCalculations } from './market-flow/useOrbitalCalculations';
import { createLinkPaths, updateLinkPaths } from './market-flow/LinkPaths';
import { createNodeElements } from './market-flow/node-elements';
import { createOrbitalPaths, createStarfield } from './market-flow/OrbitalPaths';

interface IndexFlowChartProps {
  data: IndexRotationResult;
}

const IndexFlowChart: React.FC<IndexFlowChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const { calculateOrbitalPositions, positionNodesInOrbits } = useOrbitalCalculations();

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content using native DOM methods
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Set SVG attributes
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    
    // Add starfield background
    createStarfield({ appendChild: (el: any) => svg.appendChild(el) } as any, width, height, 300);
    
    // Find central index (BTC)
    const centralIndex = data.indices.find(index => index.id === 'BTC') || 
                        data.indices.find(index => index.id === 'DXY') || 
                        data.indices[0];
    
    // Create nodes for the indices based on market cap
    const nodes = data.indices.map(index => {
      const isCentral = index.id === centralIndex.id;
      // Calculate radius based on market cap (square root scale for better visibility)
      const marketCapRatio = index.marketCap ? Math.sqrt(index.marketCap / (centralIndex.marketCap || 1)) : 0.3;
      const baseRadius = isCentral ? 70 : Math.max(25, Math.min(50, 25 * marketCapRatio));
      
      return {
        id: index.id,
        name: index.name || index.id,
        value: index.value || 0,
        change: index.change || 0,
        color: index.color,
        marketCap: index.marketCap || 0,
        radius: baseRadius,
        x: 0,
        y: 0,
        isCentral
      };
    });
    
    // Create links from the flows
    const links = data.flows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    })).filter(link => link.source && link.target);
    
    // Calculate orbital distances based on market cap
    const orbitRadii = calculateOrbitalPositions(nodes, width, height);
    
    // Draw orbit paths
    createOrbitalPaths({ appendChild: (el: any) => svg.appendChild(el) } as any, nodes, width, height, orbitRadii);
    
    // Position nodes in orbital arrangement based on market cap
    positionNodesInOrbits(nodes, width, height, orbitRadii);
    
    // Draw links (connections)
    const link = createLinkPaths({ svg: { appendChild: (el: any) => svg.appendChild(el) }, links });
    
    // Draw nodes (circles with logos)
    const node = createNodeElements({ svg: { appendChild: (el: any) => svg.appendChild(el) }, nodes });
    
    // Update link positions
    updateLinkPaths(link);
    
    // Animation for orbital movement
    const animate = () => {
      // Create subtle orbital movement
      nodes.forEach((node, i) => {
        if (!node.isCentral) {
          // Smaller cryptocurrencies move faster
          const speed = 0.0005 / (node.marketCap ? Math.sqrt(node.marketCap / 1e9) * 0.5 : 1);
          const angle = Math.atan2(node.y - height/2, node.x - width/2) + speed;
          const radius = orbitRadii[i];
          
          node.x = width/2 + Math.cos(angle) * radius;
          node.y = height/2 + Math.sin(angle) * radius;
        }
      });
      
      // Update node positions using native DOM methods
      node.forEach((nodeElement: any, i: number) => {
        if (nodeElement && nodes[i]) {
          nodeElement.setAttribute("transform", `translate(${nodes[i].x || 0},${nodes[i].y || 0})`);
        }
      });
      
      // Update link positions
      updateLinkPaths(link);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, calculateOrbitalPositions, positionNodesInOrbits]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default IndexFlowChart;
