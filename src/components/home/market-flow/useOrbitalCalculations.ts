
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
    const minRadius = Math.min(width, height) * 0.25; // Increased from 0.20
    const maxRadius = Math.min(width, height) * 0.48; // Increased from 0.45
    
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
  
  // Position nodes in orbits with improved spacing
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
        
        // Calculate angles with better distribution to avoid node overlap
        const goldRatio = 1.618033988749895; // Using golden ratio for optimal distribution
        const angle = (nonCentralIndex * goldRatio * Math.PI * 2) % (Math.PI * 2);
        
        node.x = width/2 + Math.cos(angle) * orbitRadii[i];
        node.y = height/2 + Math.sin(angle) * orbitRadii[i];
      }
    });
    
    return nodes;
  };

  // Add starfield creation function
  const createStarfield = (
    svg: any,
    width: number,
    height: number,
    numStars: number = 150 // Increased number of stars
  ) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.2; // Slightly larger stars
      const opacity = Math.random() * 0.6 + 0.1; // More visible stars
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add twinkling to more stars
      if (Math.random() > 0.6) { // More twinkling stars
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.3};${opacity}`)
          .attr("dur", `${2 + Math.random() * 5}s`)
          .attr("repeatCount", "indefinite");
      }
    }
    
    return starGroup;
  };

  return {
    calculateOrbitalPositions,
    positionNodesInOrbits,
    createStarfield
  };
};
