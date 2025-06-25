
import * as d3 from 'd3';

export function setupOrbitalAnimation(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: any[],
  link: d3.Selection<d3.BaseType, any, SVGGElement, unknown>,
  width: number,
  height: number
): number {
  // **OPTIMIZED: Slower rotation for more realistic and smoother movement**
  const rotationSpeed = 0.00003; // Reduced from 0.00005
  
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
    
    // **FIX: Update ALL node-related elements together to prevent misalignment**
    const nodeSelection = svg.selectAll(".node");
    
    // Update node group positions
    nodeSelection.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // **CRITICAL FIX: Update gradient background positions to match nodes exactly**
    svg.selectAll(".node-background")
      .attr("cx", d => d.x || 0)
      .attr("cy", d => d.y || 0);
      
    // **CRITICAL FIX: Update central pulse position to match central node exactly**
    svg.selectAll(".central-pulse")
      .attr("cx", d => d.isCentral ? (d.x || 0) : null)
      .attr("cy", d => d.isCentral ? (d.y || 0) : null);
    
    // **ENHANCED: Update all node visual elements (logos, glows, etc.)**
    svg.selectAll(".node-glow")
      .attr("cx", d => d.x || 0)
      .attr("cy", d => d.y || 0);
    
    svg.selectAll(".node-logo")
      .attr("x", d => (d.x || 0) - (d.radius || 20) / 2)
      .attr("y", d => (d.y || 0) - (d.radius || 20) / 2);
    
    // Update link positions with smoother curves
    link.attr("d", (d: any) => {
      const dx = (d.target.x || 0) - (d.source.x || 0);
      const dy = (d.target.y || 0) - (d.source.y || 0);
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Reduced curve factor for smoother lines
      return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
    });
    
    // Continue animation
    return requestAnimationFrame(animateOrbits);
  }
  
  // Start animation
  return animateOrbits();
}
