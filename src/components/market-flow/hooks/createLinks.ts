
export const createLinks = (
  svg: any,
  flows: any[],
  nodes: any[]
) => {
  // Create links from flows
  const links = flows.map(flow => ({
    source: nodes.find(n => n.id === flow.from),
    target: nodes.find(n => n.id === flow.to),
    value: flow.value,
    percentage: flow.percentage
  })).filter(link => link.source && link.target);
  
  // Create defs for markers
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);
  
  links.forEach((d, i) => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", `arrow-${i}`);
    marker.setAttribute("viewBox", "0 -5 10 10");
    marker.setAttribute("refX", "25");
    marker.setAttribute("refY", "0");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto");
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066");
    path.setAttribute("d", "M0,-5L10,0L0,5");
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  
  // Create link group
  const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  linkGroup.setAttribute("class", "links");
  svg.appendChild(linkGroup);
  
  const linkElements: SVGPathElement[] = [];
  
  links.forEach((d, i) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "link");
    path.setAttribute("stroke", d.percentage > 0 ? "#00ffcc" : "#ff0066");
    path.setAttribute("stroke-width", (2 + (Math.abs(d.value) / 10) * 6).toString());
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-dasharray", "10,10");
    path.setAttribute("opacity", "0.7");
    path.setAttribute("marker-end", `url(#arrow-${i})`);
    
    // Create curved path
    const dx = (d.target.x || 0) - (d.source.x || 0);
    const dy = (d.target.y || 0) - (d.source.y || 0);
    const dr = Math.sqrt(dx * dx + dy * dy) * 2;
    const pathData = `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
    path.setAttribute("d", pathData);
    
    linkGroup.appendChild(path);
    linkElements.push(path);
  });
  
  // Add flow particles
  addFlowParticles(svg, links);
  
  return linkElements;
};

function addFlowParticles(svg: any, links: any[]) {
  links.forEach((d, i) => {
    // Create particle group for this link
    const particleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    particleGroup.setAttribute("class", "flow-particles");
    svg.appendChild(particleGroup);
    
    // Create 5 particles per link
    for (let j = 0; j < 5; j++) {
      const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      particle.setAttribute("r", "2");
      particle.setAttribute("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066");
      particle.setAttribute("opacity", "0.8");
      particleGroup.appendChild(particle);
    }
    
    // Simple animation using CSS
    particleGroup.style.animation = `flowParticles${i} 3s linear infinite`;
  });
}
