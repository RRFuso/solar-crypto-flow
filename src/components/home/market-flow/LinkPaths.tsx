
export const createLinkPaths = (options: { svg: any; links: any[] }) => {
  const { svg, links } = options;
  
  // Create link group
  const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  linkGroup.setAttribute("class", "links");
  svg.appendChild(linkGroup);
  
  const linkElements: SVGPathElement[] = [];
  
  links.forEach((link, index) => {
    if (!link.source || !link.target) return;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "link");
    path.setAttribute("stroke", link.percentage > 0 ? "#4ade80" : "#f43f5e");
    path.setAttribute("stroke-width", (2 + Math.abs(link.percentage) * 0.1).toString());
    path.setAttribute("fill", "none");
    path.setAttribute("opacity", "0.6");
    path.setAttribute("stroke-dasharray", "5,5");
    
    // Calculate curved path
    const dx = (link.target.x || 0) - (link.source.x || 0);
    const dy = (link.target.y || 0) - (link.source.y || 0);
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
    const pathData = `M${link.source.x || 0},${link.source.y || 0}A${dr},${dr} 0 0,1 ${link.target.x || 0},${link.target.y || 0}`;
    path.setAttribute("d", pathData);
    
    linkGroup.appendChild(path);
    linkElements.push(path);
  });
  
  return linkElements;
};

export const updateLinkPaths = (linkElements: SVGPathElement[]) => {
  // Links are updated in the animation loop
  return linkElements;
};
