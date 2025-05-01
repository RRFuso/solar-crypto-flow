
import * as d3 from 'd3';
import { CapitalFlowNode, CapitalFlowLink } from '@/types/capitalFlow';

/**
 * Applies styling and event handlers to links
 */
export const stylizeLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId?: string | null,
  onMouseOver?: (event: MouseEvent, linkData: any) => void,
  onMouseOut?: (event: MouseEvent, linkData: any) => void
) => {
  // Draw links with dynamic orbital paths
  const link = linkGroup.selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d => {
      // Create curved paths between nodes
      return calculateOrbitalPath(d);
    })
    .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e") // Green for positive flow, red for negative
    .attr("stroke-width", d => {
      // Calculate base width based on flow value - thicker for more significant flows
      const baseWidth = 1 + Math.min(8, Math.abs(d.value));
      
      // If this link is connected to the selected node, make it wider
      if (selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)) {
        return baseWidth * 1.5;
      }
      return baseWidth;
    })
    .attr("fill", "none")
    .attr("stroke-dasharray", "6,6")
    .attr("opacity", d => {
      // If a node is selected, fade links that don't involve it
      if (selectedNodeId && d.source.id !== selectedNodeId && d.target.id !== selectedNodeId) {
        return 0.2;
      }
      return 0.7;
    });
    
  // Add hover effect to links
  if (onMouseOver && onMouseOut) {
    link
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke-width", d => 2 + Math.min(8, Math.abs(d.value)))
          .attr("filter", "url(#glow-filter)");
          
        onMouseOver(event, d);
      })
      .on("mouseout", function(event, d) {
        const currentData = d3.select(this).datum();
        // Restore original link style
        d3.select(this)
          .attr("opacity", selectedNodeId && (currentData.source.id !== selectedNodeId && currentData.target.id !== selectedNodeId) ? 0.2 : 0.7)
          .attr("stroke-width", d => {
            const baseWidth = 1 + Math.min(8, Math.abs(d.value));
            return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
          })
          .attr("filter", null);
          
        onMouseOut(event, d);
      });
  }
  
  return link;
};

/**
 * Calculates a dynamic orbital path between two nodes
 */
export const calculateOrbitalPath = (link: any) => {
  const sourceX = link.source.x;
  const sourceY = link.source.y;
  const targetX = link.target.x;
  const targetY = link.target.y;
  
  // Calculate the distance between points
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Adjust the curve factor based on distance
  const curveFactor = Math.min(distance * 0.5, 100);
  
  // Find perpendicular vector for control point
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  // Calculate normal vector
  const nx = -dy / distance;
  const ny = dx / distance;
  
  // Create control point
  const controlX = midX + nx * curveFactor;
  const controlY = midY + ny * curveFactor;
  
  // Return quadratic Bezier curve path
  return `M${sourceX},${sourceY} Q${controlX},${controlY} ${targetX},${targetY}`;
};

/**
 * Creates arrowheads markers for directional flow
 */
export const createArrowheads = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  links: any[]
) => {
  const defs = svg.append("defs");
  
  // Add global glow filter
  defs.append("filter")
    .attr("id", "glow-filter")
    .append("feGaussianBlur")
    .attr("stdDeviation", "2")
    .attr("result", "coloredBlur");
  
  // Create a unique arrow marker for each link
  links.forEach((link, i) => {
    const markerId = link.markerId || `arrowhead-${i}`;
    const color = link.percentage > 0 ? "#4ade80" : "#f43f5e";
    
    defs.append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22) // Position the arrowhead away from the target
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", color);
    
    // Apply the marker to the link
    link.markerId = markerId;
  });
  
  return defs;
};
