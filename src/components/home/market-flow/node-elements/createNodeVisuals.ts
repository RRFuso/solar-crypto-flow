
import * as d3 from 'd3';

export const createNodeVisuals = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add glowing effect behind nodes
  node.append("circle")
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => d.isCentral ? "rgba(247, 147, 26, 0.3)" : "rgba(0, 181, 216, 0.3)") // Orange for BTC, blue for others
    .attr("filter", "blur(8px)");
  
  // Add the main node circle with pattern fill for logo
  node.append("circle")
    .attr("r", d => d.radius)
    .attr("fill", d => `url(#logo-${d.id})`) // Use pattern with logo
    .attr("stroke", d => d.isCentral ? "#F7931A" : "#00b5d8") // Bitcoin orange for BTC, blue for others
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
