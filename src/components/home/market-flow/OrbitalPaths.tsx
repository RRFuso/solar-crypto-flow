
import { NarrativeNode } from '@/types/narratives';

export const useOrbitalPaths = () => {
  // Create orbital paths for solar system effect using native DOM methods
  const createOrbitalPaths = (
    svg: any,
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
      const orbitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      orbitGroup.setAttribute("class", "orbit-paths");
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      
      // Calculate distance from central node for each other node
      nonCentralNodes.forEach(node => {
        // Calculate distance
        const dx = node.x - centralNode.x;
        const dy = node.y - centralNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Draw orbit circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", centerX.toString());
        circle.setAttribute("cy", centerY.toString());
        circle.setAttribute("r", distance.toString());
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
        circle.setAttribute("stroke-width", "1");
        circle.setAttribute("stroke-dasharray", "3,3");
        
        orbitGroup.appendChild(circle);
      });
      
      svg.appendChild(orbitGroup);
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
  svg: any,
  nodes: any[],
  width: number,
  height: number,
  orbitRadii: number[]
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw orbital circles based on provided radii
  const orbitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  orbitGroup.setAttribute("class", "orbit-paths");
  
  orbitRadii.forEach((radius, index) => {
    if (radius > 0) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", centerX.toString());
      circle.setAttribute("cy", centerY.toString());
      circle.setAttribute("r", radius.toString());
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
      circle.setAttribute("stroke-width", "1");
      circle.setAttribute("stroke-dasharray", "3,3");
      
      orbitGroup.appendChild(circle);
    }
  });
  
  svg.appendChild(orbitGroup);
  return orbitGroup;
};

export const createStarfield = (
  svg: any,
  width: number,
  height: number,
  numStars: number = 200
) => {
  const starGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  starGroup.setAttribute("class", "starfield");
  
  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 0.1;
    const opacity = Math.random() * 0.6 + 0.1;
    
    // Create a star
    const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    star.setAttribute("cx", x.toString());
    star.setAttribute("cy", y.toString());
    star.setAttribute("r", size.toString());
    star.setAttribute("fill", "white");
    star.setAttribute("opacity", opacity.toString());
    
    starGroup.appendChild(star);
      
    // Add subtle twinkle animation to some stars
    if (Math.random() > 0.7) {
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute("attributeName", "opacity");
      animate.setAttribute("values", `${opacity};${opacity * 0.4};${opacity}`);
      animate.setAttribute("dur", `${2 + Math.random() * 6}s`);
      animate.setAttribute("repeatCount", "indefinite");
      star.appendChild(animate);
    }
  }
  
  svg.appendChild(starGroup);
  return starGroup;
};
