
import * as d3 from 'd3';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

export const createNodeVisuals = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  node: d3.Selection<SVGGElement, any, SVGGElement, unknown>
) => {
  // Add outer glow for better visibility
  node.append("circle")
    .attr("class", "outer-glow")
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => d.color)
    .attr("opacity", 0.15)
    .attr("filter", "blur(12px)"); // Stronger blur
  
  // Add inner glowing effect for planetary look
  node.append("circle")
    .attr("class", "glow")
    .attr("r", d => d.radius * 1.2)
    .attr("fill", d => d.color)
    .attr("opacity", 0.3)
    .attr("filter", "blur(6px)");
  
  // Add circles with gradient effect
  node.each(function(d) {
    const nodeGroup = d3.select(this);
    
    // Create unique gradient ID
    const gradientId = `gradient-${d.id}`;
    
    // Add gradient definition
    const gradient = svg.append("defs")
      .append("radialGradient")
      .attr("id", gradientId)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%");
      
    // Add gradient stops
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d3.color(d.color)?.brighter(0.5)?.toString() || d.color)
      .attr("stop-opacity", 0.9);
      
    gradient.append("stop")
      .attr("offset", "80%")
      .attr("stop-color", d.color)
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.color(d.color)?.darker(0.5)?.toString() || d.color)
      .attr("stop-opacity", 0.8);
      
    // Add main circle with gradient
    nodeGroup.append("circle")
      .attr("r", d.radius)
      .attr("fill", `url(#${gradientId})`)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);
    
    // Add logo at the top of the circle
    const logoPadding = d.radius * 0.5;
    const logoSize = d.radius * 0.8;
    
    nodeGroup.append("image")
      .attr("xlink:href", () => {
        // Try to get logo URL, fallback to a color if unavailable
        const logoUrl = getCryptoLogoUrl(d.id.toLowerCase()) || 
                      getFallbackLogoUrl();
        return logoUrl || `https://cryptocurrencyliveprices.com/img/${d.id.toLowerCase()}.png`;
      })
      .attr("x", -logoSize / 2)
      .attr("y", -d.radius * 0.8) // Position at top
      .attr("width", logoSize)
      .attr("height", logoSize)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .on("error", function() {
        // If image fails to load, replace with a colored circle
        d3.select(this)
          .attr("xlink:href", null)
          .remove();
          
        nodeGroup.append("circle")
          .attr("cx", 0)
          .attr("cy", -d.radius * 0.6)
          .attr("r", logoSize / 2)
          .attr("fill", d.color);
      });
  });

  return node;
};
