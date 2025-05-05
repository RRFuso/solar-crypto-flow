
import * as d3 from 'd3';

export function setupOrbitalAnimation(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: any[],
  link: d3.Selection<d3.BaseType, any, SVGGElement, unknown>,
  width: number,
  height: number
): number {
  // Slow rotation for more realistic planetary movement
  const rotationSpeed = 0.00005;
  
  function animateOrbits() {
    nodes.forEach((node, i) => {
      if (node.isCentral) return; // Skip central node
      
      // Calculate current angle and radius
      const dx = node.x - width/2;
      const dy = node.y - height/2;
      const angle = Math.atan2(dy, dx) + rotationSpeed;
      const radius = Math.sqrt(dx*dx + dy*dy);
      
      // Update position with rotation
      node.x = width/2 + Math.cos(angle) * radius;
      node.y = height/2 + Math.sin(angle) * radius;
    });
    
    // Update node positions
    svg.selectAll(".node")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // Update gradient background positions
    svg.selectAll(".node-background")
      .attr("cx", d => d.x || 0)
      .attr("cy", d => d.y || 0);
      
    // Update central pulse position if it exists
    svg.selectAll(".central-pulse")
      .attr("cx", d => d.isCentral ? d.x : null)
      .attr("cy", d => d.isCentral ? d.y : null);
    
    // Update link positions
    link.attr("d", (d: any) => {
      const dx = (d.target.x || 0) - (d.source.x || 0);
      const dy = (d.target.y || 0) - (d.source.y || 0);
      const dr = Math.sqrt(dx * dx + dy * dy) * 2;
      return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
    });
    
    // Continue animation
    return requestAnimationFrame(animateOrbits);
  }
  
  // Start animation
  return animateOrbits();
}
