
import * as d3 from 'd3';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { MarketIndex } from '@/types/indices';

export const createNodePatterns = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: MarketIndex[]
) => {
  // Create defs for logo image patterns
  const defs = svg.append("defs");
  
  // Create patterns for each node to hold the logo
  nodes.forEach(node => {
    const patternId = `logo-${node.id}`;
    const pattern = defs.append("pattern")
      .attr("id", patternId)
      .attr("width", 1)
      .attr("height", 1)
      .attr("patternUnits", "objectBoundingBox");
      
    // Add image to pattern
    pattern.append("image")
      .attr("xlink:href", getLogoUrls(node.id)[0])
      .attr("width", node.radius * 2 * 0.8) // 80% of the circle's diameter
      .attr("height", node.radius * 2 * 0.8)
      .attr("x", node.radius * 0.2) // Center the image
      .attr("y", node.radius * 0.2)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .on("error", function() {
        // Fallback to alternative source if primary logo fails to load
        d3.select(this).attr("xlink:href", getLogoUrls(node.id)[1]);
      });
  });
};
