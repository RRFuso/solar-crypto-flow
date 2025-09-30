
import * as d3 from 'd3';
import { LinkData } from '@/types/capitalFlow';
import { belongsToCategory } from '@/lib/marketData/categoryMapping';

/**
 * Creates stylized curved links with varying thickness based on flow value
 */
export const stylizeLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: LinkData[],
  selectedNodeId?: string | null,
  handleMouseOver?: (event: MouseEvent, linkData: LinkData) => void,
  handleMouseOut?: (event: MouseEvent, linkData: LinkData) => void,
  activeCategory: string = 'all'
) => {
  // Create gradient definitions section
  const defs = svg.append("defs");
  
  // Create gradients for each link
  links.forEach((link: LinkData, i) => {
    const gradientId = `link-gradient-${i}`;
    
    // Determine colors based on flow direction
    const startColor = link.percentage > 0 ? "#ff3366" : "#4ade80"; // Red to Green
    const endColor = link.percentage > 0 ? "#4ade80" : "#ff3366"; // Green to Red
    
    // Create gradient with proper data binding
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .datum(link) // Bind link data to gradient
      .attr("x1", (d: LinkData) => d.source.x)
      .attr("y1", (d: LinkData) => d.source.y)
      .attr("x2", (d: LinkData) => d.target.x)
      .attr("y2", (d: LinkData) => d.target.y);
      
    // Add gradient stops
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", startColor)
      .attr("stop-opacity", 0.9);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", endColor)
      .attr("stop-opacity", 0.9);
  });
  
  // Draw links with curved paths
  const link = linkGroup.selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link-path")
    .attr("id", (d: LinkData, i) => `link-${i}`)
    .attr("stroke", (d: LinkData, i) => `url(#link-gradient-${i})`)
    .attr("stroke-width", (d: LinkData) => {
      // Base width on flow value, scaled for visualization
      const baseWidth = 1.5 + Math.min(6, Math.sqrt(Math.abs(d.value)) / 10);
      // If selected, make wider
      return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
    })
    .attr("fill", "none")
    .attr("opacity", (d: LinkData) => {
      // Opacity based on category filter
      if (activeCategory !== 'all') {
        const sourceInCategory = d.source.categories?.includes(activeCategory);
        const targetInCategory = d.target.categories?.includes(activeCategory);
        
        // Se PELO MENOS UM dos nós pertence à categoria, opacidade normal. Senão, reduzida.
        if (!sourceInCategory && !targetInCategory) {
          return 0.1;
        }
      }
      
      // Opacity based on selection
      if (selectedNodeId) {
        return d.source.id === selectedNodeId || d.target.id === selectedNodeId ? 0.9 : 0.15;
      }
      return 0.8;
    })
    .attr("d", (d: LinkData) => {
      // Create path from source to target with curve
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    })
    .attr("stroke-dasharray", "8,4") // Add dashed line
    .attr("marker-end", (d: LinkData, i) => `url(#${d.markerId})`)
    .style("animation", "flowDash 15s linear infinite"); // Add flow animation
    
  // Add interactive events
  if (handleMouseOver && handleMouseOut) {
    link
      .on("mouseover", function(event, d: LinkData) {
        // Highlight on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", (d: LinkData) => {
            const baseWidth = 1.5 + Math.min(6, Math.sqrt(Math.abs(d.value || 0)) / 10);
            return baseWidth * 1.8;
          })
          .attr("opacity", 1);
        
        handleMouseOver(event, d);
      })
      .on("mouseout", function(event, d: LinkData) {
        // Return to normal or selected state
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", (d: LinkData) => {
            const baseWidth = 1.5 + Math.min(6, Math.sqrt(Math.abs(d.value || 0)) / 10);
            return selectedNodeId && (d.source?.id === selectedNodeId || d.target?.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
          })
          .attr("opacity", (d: LinkData) => {
            // Opacity based on category filter
            if (activeCategory !== 'all') {
              const sourceInCategory = d.source.categories?.includes(activeCategory);
              const targetInCategory = d.target.categories?.includes(activeCategory);
              
              if (!sourceInCategory && !targetInCategory) {
                return 0.1;
              }
            }
            
            if (selectedNodeId) {
              return d.source?.id === selectedNodeId || d.target?.id === selectedNodeId ? 0.9 : 0.15;
            }
            return 0.8;
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
  links: LinkData[]
) => {
  // Create arrowheads for directional flow
  const defs = svg.select("defs");
  
  links.forEach((link: LinkData, i) => {
    // Determine color based on flow direction
    const arrowColor = link.percentage > 0 ? "#4ade80" : "#ff3366"; // Green for inflows, Red for outflows
    
    // Create arrowhead marker
    defs.append("marker")
      .attr("id", link.markerId)
      .attr("viewBox", "0 -5 10 10")
      .datum(link) // Bind link data to marker
      .attr("refX", (d: LinkData) => 8 + (d.target?.radius || 20) * 0.7) // Dynamic refX based on target node size
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", arrowColor)
      .attr("d", "M0,-5L10,0L0,5");
  });
};
