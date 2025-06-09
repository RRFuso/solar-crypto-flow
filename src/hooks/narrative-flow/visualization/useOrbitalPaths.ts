
import { NarrativeNode } from '@/types/narratives';

export const useOrbitalPaths = () => {
  // Create orbital paths for solar system effect using native DOM methods
  const createOrbitalPaths = (
    svg: Element,
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
