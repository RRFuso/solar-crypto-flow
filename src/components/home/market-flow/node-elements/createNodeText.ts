
import * as d3 from 'd3';
import { MarketIndex } from '@/types/indices';

export const createNodeText = (
  node: d3.Selection<SVGGElement, MarketIndex, SVGGElement, unknown>
) => {
  // Add ticker text below
  node.append("text")
    .attr("class", "ticker")
    .attr("text-anchor", "middle")
    .attr("dy", "2.0em") // Adjusted position to accommodate logo above
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", d => d.isCentral ? "16px" : "14px") // Larger font for central node
    .attr("stroke", "rgba(0, 0, 0, 0.7)")
    .attr("stroke-width", "0.5px")
    .text(d => d.id);
  
  // Add crypto name (if available)
  node.append("text")
    .attr("class", "name")
    .attr("text-anchor", "middle")
    .attr("dy", "3.2em") // Position below ticker
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("font-size", "10px")
    .attr("font-weight", "500")
    .text(d => d.name && d.name !== d.id ? d.name.substring(0, 12) : "");
  
  // Add percentage change with enhanced visibility
  node.append("text")
    .attr("class", "percentage")
    .attr("text-anchor", "middle")
    .attr("dy", "4.4em") // Position below name
    .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .attr("stroke", "rgba(0, 0, 0, 0.8)") // Stronger outline
    .attr("stroke-width", "0.6px")
    .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");

  return node;
};
