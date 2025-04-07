
import { MarketIndex } from "@/types/indices";

interface OrbitalPositions {
  width: number;
  height: number;
  nodes: any[];
}

export const useOrbitalCalculations = () => {
  // Calculate orbital positions for planetary-like arrangement
  const calculateOrbitalPositions = (nodes: any[], width: number, height: number) => {
    const centralIndex = nodes.findIndex(n => n.isCentral);
    const minRadius = Math.min(width, height) * 0.20; // Increased from 0.15
    const maxRadius = Math.min(width, height) * 0.45; // Increased from 0.35
    
    // Calculate spacing between orbits
    const nonCentralNodes = nodes.filter(n => !n.isCentral);
    const orbitStep = (maxRadius - minRadius) / (nonCentralNodes.length > 0 ? nonCentralNodes.length : 1);
    
    // Assign orbit radii
    return nodes.map((n, i) => {
      if (n.isCentral) return 0;
      
      // How many non-central nodes came before this one
      const nonCentralIndex = nodes.slice(0, i).filter(node => !node.isCentral).length;
      return minRadius + (nonCentralIndex * orbitStep);
    });
  };
  
  // Position nodes in orbits
  const positionNodesInOrbits = (nodes: any[], width: number, height: number, orbitRadii: number[]) => {
    // Central node in the middle
    nodes.forEach((node, i) => {
      if (node.isCentral) {
        node.x = width / 2;
        node.y = height / 2;
      } else {
        // Distribute non-central nodes around their orbits
        const nonCentralIndex = nodes.slice(0, i).filter(n => !n.isCentral).length;
        const totalNonCentral = nodes.filter(n => !n.isCentral).length;
        const angle = (nonCentralIndex / totalNonCentral) * Math.PI * 2;
        
        node.x = width/2 + Math.cos(angle) * orbitRadii[i];
        node.y = height/2 + Math.sin(angle) * orbitRadii[i];
      }
    });
    
    return nodes;
  };

  return {
    calculateOrbitalPositions,
    positionNodesInOrbits
  };
};
