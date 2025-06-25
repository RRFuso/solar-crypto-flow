
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
    const minRadius = Math.min(width, height) * 0.25; 
    const maxRadius = Math.min(width, height) * 0.45;
    
    // Sort non-central nodes by market cap in descending order
    const nonCentralNodes = nodes
      .filter(n => !n.isCentral)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    
    // Number of orbits - based on node count
    const orbitCount = Math.min(5, Math.ceil(nonCentralNodes.length / 6));
    const orbitStep = (maxRadius - minRadius) / orbitCount;
    
    // Assign orbit radii based on market cap
    return nodes.map(node => {
      if (node.isCentral) return 0;
      
      // Find position in sorted list by market cap
      const marketCapRank = nonCentralNodes.findIndex(n => n.id === node.id);
      
      // Divide into orbits based on market cap rank
      // Highest market caps get inner orbits
      const orbitIndex = Math.min(orbitCount - 1, Math.floor(marketCapRank / 6));
      
      // Calculate orbit radius with spacing
      return minRadius + (orbitIndex * orbitStep);
    });
  };
  
  // Position nodes in orbits using golden ratio for better distribution
  const positionNodesInOrbits = (nodes: any[], width: number, height: number, orbitRadii: number[]) => {
    // Place central node in the middle
    nodes.forEach((node, i) => {
      if (node.isCentral) {
        node.x = width / 2;
        node.y = height / 2;
      } else {
        // Get orbit radius for this node
        const radius = orbitRadii[i];
        
        // Find nodes in the same orbit
        const nodesInSameOrbit = nodes.filter((n, idx) => 
          !n.isCentral && Math.abs(orbitRadii[idx] - radius) < 5
        );
        
        // Calculate position in orbit
        const orbitPosition = nodesInSameOrbit.findIndex(n => n.id === node.id);
        const totalInOrbit = nodesInSameOrbit.length;
        
        // Golden ratio distribution for more even spacing
        const goldenRatio = 0.618033988749895;
        const angle = (orbitPosition / totalInOrbit + goldenRatio * i) * Math.PI * 2;
        
        // Set position
        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      }
    });
    
    return nodes;
  };

  // Add starfield creation function
  const createStarfield = (
    svg: any,
    width: number,
    height: number,
    numStars: number = 150
  ) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.2;
      const opacity = Math.random() * 0.6 + 0.1;
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add twinkling to more stars
      if (Math.random() > 0.6) {
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
