
import * as d3 from 'd3';

import { globalAnimator, SmoothInterpolator, domBatcher } from '@/utils/animationOptimizer';

export function setupOrbitalAnimation(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: any[],
  link: d3.Selection<d3.BaseType, any, SVGGElement, unknown>,
  width: number,
  height: number
): number {
  // **OPTIMIZED: Even slower rotation for ultra-smooth movement**
  const rotationSpeed = 0.00002; // Further reduced for smoother animation
  
  // Create smooth interpolators for each node
  const nodeInterpolators = new Map();
  nodes.forEach(node => {
    if (!node.isCentral) {
      nodeInterpolators.set(node.id || node.symbol, {
        x: new SmoothInterpolator(node.x, 0.12),
        y: new SmoothInterpolator(node.y, 0.12)
      });
    }
  });
  
  const animateOrbits = (deltaTime: number) => {
    const updates: (() => void)[] = [];
    
    nodes.forEach((node, i) => {
      if (node.isCentral) return; // Skip central node
      
      // Calculate target position with rotation
      const dx = node.x - width/2;
      const dy = node.y - height/2;
      const angle = Math.atan2(dy, dx) + (rotationSpeed * deltaTime / 16.67);
      const radius = Math.sqrt(dx*dx + dy*dy);
      
      const targetX = width/2 + Math.cos(angle) * radius;
      const targetY = height/2 + Math.sin(angle) * radius;
      
      // Use smooth interpolation for position updates
      const interpolator = nodeInterpolators.get(node.id || node.symbol);
      if (interpolator) {
        interpolator.x.setTarget(targetX);
        interpolator.y.setTarget(targetY);
        
        node.x = interpolator.x.update(deltaTime);
        node.y = interpolator.y.update(deltaTime);
      } else {
        // Fallback to direct assignment
        node.x = targetX;
        node.y = targetY;
      }
    });
    
    // Batch all DOM updates
    updates.push(() => {
      // Update node group positions
      svg.selectAll(".node")
        .attr("transform", (d: any) => `translate(${d.x || 0},${d.y || 0})`);
      
      // Update gradient background positions
      svg.selectAll(".node-background")
        .attr("cx", (d: any) => d.x || 0)
        .attr("cy", (d: any) => d.y || 0);
        
      // Update central pulse position
      svg.selectAll(".central-pulse")
        .attr("cx", (d: any) => d.isCentral ? (d.x || 0) : null)
        .attr("cy", (d: any) => d.isCentral ? (d.y || 0) : null);
      
      // Update all node visual elements
      svg.selectAll(".node-glow")
        .attr("cx", (d: any) => d.x || 0)
        .attr("cy", (d: any) => d.y || 0);
      
      svg.selectAll(".node-logo")
        .attr("x", (d: any) => (d.x || 0) - (d.radius || 20) / 2)
        .attr("y", (d: any) => (d.y || 0) - (d.radius || 20) / 2);
      
      // Update link positions with smoother curves
      link.attr("d", (d: any) => {
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Optimized curve factor
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
      });
    });
    
    // Execute all DOM updates at once
    domBatcher.add(() => updates.forEach(update => update()));
  };
  
  // Register with global animator for coordinated animation
  globalAnimator.addCallback(animateOrbits);
  globalAnimator.start();
  
  // Return a flag to indicate we're using the global animator
  return 1;
}
