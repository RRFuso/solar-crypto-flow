
import * as d3 from 'd3';

export const createNodeVisuals = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add color-coded glow effect behind nodes based on flow direction
  node.append("circle")
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => {
      // Default blue for neutral or central
      if (d.isCentral) return "rgba(247, 147, 26, 0.3)"; // Orange for BTC
      
      // Color based on flow direction
      if (d.inflow > d.outflow) return "rgba(0, 255, 204, 0.3)"; // Green for inflow (#00ffcc)
      if (d.outflow > d.inflow) return "rgba(255, 0, 102, 0.3)"; // Red for outflow (#ff0066)
      return "rgba(0, 181, 216, 0.3)"; // Default blue for neutral
    })
    .attr("filter", "blur(8px)");
  
  // Add the main node circle with pattern fill for logo
  node.append("circle")
    .attr("class", "node-circle")
    .attr("r", d => d.radius)
    .attr("fill", d => `url(#logo-${d.id})`) // Use pattern with logo
    .attr("stroke", d => {
      if (d.isCentral) return "#F7931A"; // Bitcoin orange for BTC
      
      // Stroke color based on flow direction
      if (d.inflow > d.outflow) return "#00ffcc"; // Green for inflow
      if (d.outflow > d.inflow) return "#ff0066"; // Red for outflow
      return "#00b5d8"; // Default blue for neutral
    })
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.9)
    .attr("filter", d => {
      if (d.isCentral) return "drop-shadow(0 0 4px rgba(247, 147, 26, 0.7))"; // Orange glow for Bitcoin
      
      // Drop shadow filter based on flow direction
      if (d.inflow > d.outflow) return "drop-shadow(0 0 4px rgba(0, 255, 204, 0.7))"; // Green glow
      if (d.outflow > d.inflow) return "drop-shadow(0 0 4px rgba(255, 0, 102, 0.7))"; // Red glow
      return "drop-shadow(0 0 4px rgba(0, 181, 216, 0.7))"; // Blue glow for neutral
    });
  
  // Remove pulse animation and replace with inner glow for central node
  if (node.filter(d => d.isCentral).size() > 0) {
    // Add special glow effect for central node (BTC)
    node.filter(d => d.isCentral)
      .select(".node-circle")
      .attr("filter", "drop-shadow(0 0 8px rgba(247, 147, 26, 0.8))"); // Stronger orange glow for BTC
  }
  
  return node;
};
