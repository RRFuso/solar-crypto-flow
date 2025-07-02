
import * as d3 from 'd3';
import { formatValue } from '../utils/formatHelpers';

/**
 * Creates and manages tooltips for link hover interactions
 */
export const createLinkTooltip = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  event: MouseEvent, 
  linkData: any
) => {
  // Show tooltip with flow details
  const tooltip = svg.append("g")
    .attr("class", "tooltip")
    .attr("transform", `translate(${event.offsetX},${event.offsetY - 40})`);
  
  tooltip.append("rect")
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", -80)
    .attr("y", -40)
    .attr("width", 160)
    .attr("height", 55)
    .attr("fill", "rgba(0, 0, 0, 0.8)")
    .attr("stroke", linkData.percentage > 0 ? "#4ade80" : "#f43f5e")
    .attr("stroke-width", 1);
    
  // Flow direction text
  tooltip.append("text")
    .attr("x", 0)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .text(`${linkData.source.id.toUpperCase()} → ${linkData.target.id.toUpperCase()}`);
  
  // Flow value text
  tooltip.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text(`Volume: $${formatValue(linkData.value)}`);
  
  // Change percentage text
  tooltip.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("fill", linkData.percentage > 0 ? "#4ade80" : "#f43f5e")
    .text(`Change: ${(linkData.percentage >= 0 ? "+" : "") + linkData.percentage.toFixed(2)}%`);
    
  return tooltip;
};

/**
 * Removes any tooltips from the SVG
 */
export const removeLinkTooltip = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
) => {
  svg.selectAll(".tooltip").remove();
};
