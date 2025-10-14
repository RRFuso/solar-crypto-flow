
import * as d3 from 'd3';
import { useMemo } from 'react';
import { IndexRotationResult } from '@/types/indices';
import { createNodes } from './createNodes';
import { createLinks } from './createLinks';
import { setupOrbitalAnimation } from './setupOrbitalAnimation';

export const useMarketFlowAnimation = () => {
  const initializeVisualization = useMemo(() => {
    return (svgElement: SVGSVGElement, data: IndexRotationResult, width: number, height: number) => {
      const svg = d3.select(svgElement)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("style", "max-width: 100%; height: auto;");
      
      // Clear only to start fresh
      svg.selectAll("*").remove();
      
      // Find central index (using SPY or S&P 500)
      const centralIndex = data.indices.find(idx => 
        idx.id === 'SPY' || idx.symbol === 'SPX' || idx.name.includes('S&P')
      ) || data.indices[0];
      
      // Create nodes for indices
      const nodes = createNodes(svg, data.indices, centralIndex, width, height);
      
      // Create links from flows
      const links = createLinks(svg, data.flows, nodes);
      
      // Start animation and return the animation frame ID
      return setupOrbitalAnimation(svg, nodes, links, width, height);
    };
  }, []);
  
  const updateVisualization = useMemo(() => {
    return (svgElement: SVGSVGElement, data: IndexRotationResult, width: number, height: number) => {
      const svg = d3.select(svgElement);
      
      // Find central index
      const centralIndex = data.indices.find(idx => 
        idx.id === 'SPY' || idx.symbol === 'SPX' || idx.name.includes('S&P')
      ) || data.indices[0];
      
      // Update links only (remove and recreate)
      svg.selectAll("g.links").remove();
      
      // Recreate nodes array with updated positions
      const nodes = createNodes(svg, data.indices, centralIndex, width, height);
      
      // Recreate links with new data
      const links = createLinks(svg, data.flows, nodes);
      
      // Update node colors and states without recreating them
      svg.selectAll(".node-background")
        .attr("fill", (d: any) => {
          if (d.isCentral) return "url(#centralGradient)";
          return d.netFlow && d.netFlow > 0 ? "url(#inflowGradient)" : "url(#outflowGradient)";
        });
    };
  }, []);
  
  const cleanupAnimation = (animationFrameId: number | null) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
  
  return {
    initializeVisualization,
    updateVisualization,
    cleanupAnimation
  };
};
