
import * as d3 from 'd3';

export const createNodeText = (
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add ticker text (index name)
  node.append("text")
    .attr("class", "ticker")
    .attr("text-anchor", "middle")
    .attr("dy", ".1em")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", d => d.isCentral ? "16px" : "14px") // Larger font for central node
    .attr("stroke", "rgba(0, 0, 0, 0.7)")
    .attr("stroke-width", "0.5px")
    .text(d => d.id); // Using ID as ticker
  
  // Add percentage change with enhanced visibility
  node.append("text")
    .attr("class", "percentage")
    .attr("text-anchor", "middle")
    .attr("dy", "1.8em")
    .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .attr("stroke", "rgba(0, 0, 0, 0.8)") // Stronger outline
    .attr("stroke-width", "0.6px")
    .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");

  return node;
};
