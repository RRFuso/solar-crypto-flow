
export function setupOrbitalAnimation(
  svg: any,
  nodes: any[],
  link: any[],
  width: number,
  height: number
): number {
  const rotationSpeed = 0.00003;
  
  function animateOrbits() {
    nodes.forEach((node, i) => {
      if (node.isCentral) return;
      
      const dx = node.x - width/2;
      const dy = node.y - height/2;
      const angle = Math.atan2(dy, dx) + rotationSpeed;
      const radius = Math.sqrt(dx*dx + dy*dy);
      
      node.x = width/2 + Math.cos(angle) * radius;
      node.y = height/2 + Math.sin(angle) * radius;
    });
    
    // Update node elements using native DOM methods
    const nodeElements = svg.querySelectorAll(".node");
    nodeElements.forEach((nodeElement: any, i: number) => {
      if (nodes[i]) {
        const node = nodes[i] as any;
        nodeElement.setAttribute("transform", `translate(${node.x || 0},${node.y || 0})`);
      }
    });
    
    // Update background elements
    const backgroundElements = svg.querySelectorAll(".node-background");
    backgroundElements.forEach((bg: any, i: number) => {
      if (nodes[i]) {
        const node = nodes[i] as any;
        bg.setAttribute("cx", node.x || 0);
        bg.setAttribute("cy", node.y || 0);
      }
    });
    
    // Update pulse elements
    const pulseElements = svg.querySelectorAll(".central-pulse");
    pulseElements.forEach((pulse: any, i: number) => {
      if (nodes[i]) {
        const node = nodes[i] as any;
        if (node.isCentral) {
          pulse.setAttribute("cx", node.x || 0);
          pulse.setAttribute("cy", node.y || 0);
        }
      }
    });
    
    // Update glow elements
    const glowElements = svg.querySelectorAll(".node-glow");
    glowElements.forEach((glow: any, i: number) => {
      if (nodes[i]) {
        const node = nodes[i] as any;
        glow.setAttribute("cx", node.x || 0);
        glow.setAttribute("cy", node.y || 0);
      }
    });
    
    // Update logo elements
    const logoElements = svg.querySelectorAll(".node-logo");
    logoElements.forEach((logo: any, i: number) => {
      if (nodes[i]) {
        const node = nodes[i] as any;
        logo.setAttribute("x", (node.x || 0) - (node.radius || 20) / 2);
        logo.setAttribute("y", (node.y || 0) - (node.radius || 20) / 2);
      }
    });
    
    // Update link positions
    link.forEach((linkElement: any, i: number) => {
      if (linkElement && nodes.length > 1) {
        const sourceNode = nodes[0];
        const targetNode = nodes[1 + i] || nodes[nodes.length - 1];
        
        const dx = (targetNode.x || 0) - (sourceNode.x || 0);
        const dy = (targetNode.y || 0) - (sourceNode.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        const pathData = `M${sourceNode.x || 0},${sourceNode.y || 0}A${dr},${dr} 0 0,1 ${targetNode.x || 0},${targetNode.y || 0}`;
        
        linkElement.setAttribute("d", pathData);
      }
    });
    
    return requestAnimationFrame(animateOrbits);
  }
  
  return animateOrbits();
}
