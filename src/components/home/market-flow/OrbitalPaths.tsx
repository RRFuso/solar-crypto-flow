
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

export const useOrbitalPaths = () => {
  // Create orbital paths for solar system effect
  const createOrbitalPaths = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    nodes: NarrativeNode[],
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Find the central node (Bitcoin or largest)
    const centralNode = nodes.find(n => n.name.toLowerCase().includes("bitcoin")) || 
                        nodes.reduce((max, n) => n.value > max.value ? n : max, nodes[0]);
    
    if (centralNode) {
      // Draw orbital circles
      const orbitGroup = svg.append("g").attr("class", "orbit-paths");
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      
      // Calculate distance from central node for each other node
      nonCentralNodes.forEach(node => {
        // Calculate distance
        const dx = node.x - centralNode.x;
        const dy = node.y - centralNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Draw orbit circle
        orbitGroup.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", distance)
          .attr("fill", "none")
          .attr("stroke", "rgba(255, 255, 255, 0.1)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");
      });
      
      return { centralNode, orbitGroup };
    }
    
    return { centralNode, orbitGroup: null };
  };

  return {
    createOrbitalPaths
  };
};

// Export the functions directly for backward compatibility
export const createOrbitalPaths = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: any[],
  width: number,
  height: number,
  orbitRadii: number[]
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw orbital circles based on provided radii
  const orbitGroup = svg.append("g").attr("class", "orbit-paths");
  
  orbitRadii.forEach((radius, index) => {
    if (radius > 0) {
      orbitGroup.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    }
  });
  
  return orbitGroup;
};

export const createStarfield = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  numStars: number = 200
) => {
  const starGroup = svg.append("g").attr("class", "starfield");
  
  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 0.1;
    const opacity = Math.random() * 0.6 + 0.1;
    
    // Create a star
    const star = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", "white")
      .attr("opacity", opacity);
      
    // Add subtle twinkle animation to some stars
    if (Math.random() > 0.7) {
      star.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", `${opacity};${opacity * 0.4};${opacity}`)
        .attr("dur", `${2 + Math.random() * 6}s`)
        .attr("repeatCount", "indefinite");
    }
  }
  
  return starGroup;
};
