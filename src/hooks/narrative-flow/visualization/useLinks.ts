
import { NarrativeLink } from './types';

export const useLinks = () => {
  // Create links between nodes using native DOM methods
  const createLinks = (
    svg: any,
    links: NarrativeLink[],
    isPredicted: boolean = false
  ) => {
    // Create link group
    const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linkGroup.setAttribute("class", "links");
    svg.appendChild(linkGroup);
    
    // Create defs for gradients and markers
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);
    
    const linkElements: SVGPathElement[] = [];
    
    links.forEach((d, i) => {
      // Create gradient for this link
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      gradient.setAttribute("id", `flow-gradient-${i}`);
      gradient.setAttribute("gradientUnits", "userSpaceOnUse");
      gradient.setAttribute("x1", d.source.x.toString());
      gradient.setAttribute("y1", d.source.y.toString());
      gradient.setAttribute("x2", d.target.x.toString());
      gradient.setAttribute("y2", d.target.y.toString());
      
      const startColor = isPredicted ? "#00ffaa" : "#ff3366";
      const endColor = isPredicted ? "#4ade80" : "#00aaff";
      
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", startColor);
      
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", endColor);
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      
      // Create marker (arrow)
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", `arrow-${i}`);
      marker.setAttribute("viewBox", "0 -5 10 10");
      marker.setAttribute("refX", "20");
      marker.setAttribute("refY", "0");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto");
      
      const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arrowPath.setAttribute("fill", isPredicted ? "#00ffaa" : "#4ade80");
      arrowPath.setAttribute("d", "M0,-5L10,0L0,5");
      marker.appendChild(arrowPath);
      defs.appendChild(marker);
      
      // Create link path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "link-path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", `url(#flow-gradient-${i})`);
      path.setAttribute("stroke-width", (2 + Math.min(8, (d.value / 1000000000) * 5)).toString());
      path.setAttribute("stroke-dasharray", "5,5");
      path.setAttribute("opacity", "0.7");
      path.setAttribute("marker-end", `url(#arrow-${i})`);
      
      // Calculate curved path
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2;
      const pathData = `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      path.setAttribute("d", pathData);
      
      // Add flow animation
      path.style.animation = "flowDash 20s linear infinite";
      
      linkGroup.appendChild(path);
      linkElements.push(path);
    });
    
    return { link: linkElements, linkGroup };
  };

  // Update link paths when nodes move
  const updateLinkPaths = (linkElements: SVGPathElement[]) => {
    // Links are static in this implementation
    // Could be enhanced to update positions if needed
  };

  // Flow particles removed as requested
  const updateFlowParticles = (svg: any, links: NarrativeLink[]) => {
    // Intentionally left empty
  };

  return {
    createLinks,
    updateLinkPaths,
    updateFlowParticles
  };
};
