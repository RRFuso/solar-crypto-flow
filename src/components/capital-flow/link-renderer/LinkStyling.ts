
import * as d3 from 'd3';

/**
 * Creates stylized curved links with varying thickness based on flow value
 */
export const stylizeLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId?: string | null,
  handleMouseOver?: (event: MouseEvent, linkData: any) => void,
  handleMouseOut?: (event: MouseEvent, linkData: any) => void
) => {
  // Create gradient for links
  const defs = svg.append("defs");
  
  // Create gradients for each link
  links.forEach((link, i) => {
    const gradientId = `link-gradient-${i}`;
    
    // Determine colors based on prediction and flow direction
    const baseColor = link.predictionColor || (link.percentage > 0 ? "#4ade80" : "#f43f5e");
    const startColor = link.percentage > 0 ? baseColor : "#ffffff";
    const endColor = link.percentage > 0 ? "#ffffff" : baseColor;
    
    // Create gradient
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", link.source.x)
      .attr("y1", link.source.y)
      .attr("x2", link.target.x)
      .attr("y2", link.target.y);
      
    // Add gradient stops
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", startColor)
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", endColor)
      .attr("stop-opacity", 0.8);
  });
  
  // Draw links with curved paths
  const link = linkGroup.selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("id", (d, i) => `link-${i}`)
    .attr("stroke", (d, i) => {
      if (d.predictionColor) {
        return d.predictionColor;
      }
      return `url(#link-gradient-${i})`;
    })
    .attr("stroke-width", d => {
      // Base width on flow value, scaled for visualization
      const baseWidth = 1.5 + Math.min(5, Math.abs(d.value) / 1000000);
      // If selected, make wider
      return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
    })
    .attr("fill", "none")
    .attr("opacity", d => {
      // Opacity based on selection or prediction
      if (selectedNodeId) {
        return d.source.id === selectedNodeId || d.target.id === selectedNodeId ? 0.9 : 0.15;
      }
      return d.predictionColor ? 0.9 : 0.6;
    })
    .attr("d", d => {
      // Create path from source to target with curve
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    })
    .style("stroke-dasharray", d => {
      // Add animation effect
      return d.predictionColor ? "none" : "5,5";
    })
    .attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
  // Add interactive events
  if (handleMouseOver && handleMouseOut) {
    link
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", d => {
            const baseWidth = 1.5 + Math.min(5, Math.abs(d.value) / 1000000);
            return baseWidth * 1.8;
          })
          .attr("opacity", 1);
        
        handleMouseOver(event, d);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", d => {
            const baseWidth = 1.5 + Math.min(5, Math.abs(d.value) / 1000000);
            return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
          })
          .attr("opacity", d => {
            if (selectedNodeId) {
              return d.source.id === selectedNodeId || d.target.id === selectedNodeId ? 0.9 : 0.15;
            }
            return d.predictionColor ? 0.9 : 0.6;
          });
        
        handleMouseOut(event, d);
      });
  }
  
  return link;
};

/**
 * Creates and applies arrowhead markers for directional flow
 */
export const createArrowheads = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  links: any[]
) => {
  // Create arrowheads for directional flow
  const defs = svg.select("defs");
  
  links.forEach((link, i) => {
    // Determine color based on prediction
    const arrowColor = link.predictionColor || (link.percentage > 0 ? "#4ade80" : "#f43f5e");
    
    // Create arrowhead marker
    defs.append("marker")
      .attr("id", link.markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", arrowColor)
      .attr("d", "M0,-5L10,0L0,5");
      
    // Create a glow filter for the arrowheads
    const arrowFilter = `arrow-glow-${i}`;
    const filter = defs.append("filter")
      .attr("id", arrowFilter)
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");
      
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "coloredBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
      
    // Apply filter if it's a prediction link
    if (link.predictionColor) {
      svg.select(`#${link.markerId} path`)
        .attr("filter", `url(#${arrowFilter})`);
    }
  });
};
