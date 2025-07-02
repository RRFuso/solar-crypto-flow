
import * as d3 from 'd3';
import { formatValue } from './utils';

export const createNodeTooltips = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add tooltips on hover
  node.on("mouseover", function(event, d) {
    const tooltip = svg.append("g")
      .attr("class", "tooltip")
      .attr("transform", `translate(${d.x},${d.y - d.radius - 80})`); // Position above the node
    
    // Add tooltip background
    tooltip.append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("x", -90)
      .attr("y", -50)
      .attr("width", 180)
      .attr("height", 70)
      .attr("fill", "rgba(0, 0, 0, 0.8)")
      .attr("stroke", d.color)
      .attr("stroke-width", 1);
    
    // Add tooltip content
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text(d.name); // Full name
    
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(`Market Cap: $${formatValue(d.value)}`);
    
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(`Change: ${(d.change >= 0 ? "+" : "") + d.change.toFixed(2)}%`);
    
    d3.select(this).style("cursor", "pointer");
  })
  .on("mouseout", function() {
    svg.selectAll(".tooltip").remove();
    d3.select(this).style("cursor", "default");
  });

  return node;
};
