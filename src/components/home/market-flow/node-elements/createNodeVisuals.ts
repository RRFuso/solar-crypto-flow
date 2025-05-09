
import * as d3 from 'd3';

export const createNodeVisuals = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add color-coded glowing effect behind nodes based on flow direction
  node.append("circle")
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => {
      // Default blue for neutral or central
      if (d.isCentral) return "rgba(247, 147, 26, 0.3)"; // Orange for BTC
      
      // Color based on flow direction
      if (d.inflow > d.outflow) return "rgba(0, 255, 0, 0.3)"; // Green for inflow
      if (d.outflow > d.inflow) return "rgba(255, 0, 0, 0.3)"; // Red for outflow
      return "rgba(0, 181, 216, 0.3)"; // Default blue for neutral
    })
    .attr("filter", "blur(8px)");
  
  // Add the main node circle with pattern fill for logo
  node.append("circle")
    .attr("r", d => d.radius)
    .attr("fill", d => `url(#logo-${d.id})`) // Use pattern with logo
    .attr("stroke", d => {
      if (d.isCentral) return "#F7931A"; // Bitcoin orange for BTC
      
      // Stroke color based on flow direction
      if (d.inflow > d.outflow) return "#00ff00"; // Green for inflow
      if (d.outflow > d.inflow) return "#ff0000"; // Red for outflow
      return "#00b5d8"; // Default blue for neutral
    })
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.9);
    
  // Add a pulse animation to the central node
  node.filter(d => d.isCentral)
    .append("circle")
    .attr("r", d => d.radius * 1.2)
    .attr("fill", "none")
    .attr("stroke", "#F7931A")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.5)
    .attr("class", "pulse-circle");
    
  // Add pulse animation with D3
  const pulseCircle = svg.selectAll(".pulse-circle");
  
  function setupPulseAnimation() {
    pulseCircle
      .attr("stroke-opacity", 0.7)
      .attr("r", d => d.radius * 1.2)
      .transition()
      .duration(2000)
      .attr("stroke-opacity", 0.1)
      .attr("r", d => d.radius * 1.6)
      .on("end", setupPulseAnimation);
  }
  
  setupPulseAnimation();
  
  return node;
};
