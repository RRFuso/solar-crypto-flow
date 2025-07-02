
import { useMemo } from 'react';
import { IndexRotationResult } from '@/types/indices';
import { createNodes } from './createNodes';
import { createLinks } from './createLinks';
import { setupOrbitalAnimation } from './setupOrbitalAnimation';

export const useMarketFlowAnimation = () => {
  const initializeVisualization = useMemo(() => {
    return (svgElement: SVGSVGElement, data: IndexRotationResult, width: number, height: number) => {
      // Set SVG attributes using native DOM methods
      svgElement.setAttribute("width", width.toString());
      svgElement.setAttribute("height", height.toString());
      svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svgElement.setAttribute("style", "max-width: 100%; height: auto;");
      
      // Find central index (using SPY or S&P 500)
      const centralIndex = data.indices.find(idx => 
        idx.id === 'SPY' || idx.symbol === 'SPX' || idx.name.includes('S&P')
      ) || data.indices[0];
      
      // Create nodes for indices
      const nodes = createNodes({ appendChild: (el: any) => svgElement.appendChild(el) } as any, data.indices, centralIndex, width, height);
      
      // Create links from flows
      const links = createLinks({ appendChild: (el: any) => svgElement.appendChild(el) } as any, data.flows, nodes);
      
      // Start animation and return the animation frame ID
      return setupOrbitalAnimation({ appendChild: (el: any) => svgElement.appendChild(el) } as any, nodes, links, width, height);
    };
  }, []);
  
  const cleanupAnimation = (animationFrameId: number | null) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
  
  return {
    initializeVisualization,
    cleanupAnimation
  };
};
