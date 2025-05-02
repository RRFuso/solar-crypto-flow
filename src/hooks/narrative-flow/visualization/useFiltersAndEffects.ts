
import * as d3 from 'd3';

export const useFiltersAndEffects = () => {
  // Create filter effects for the visualization
  const createGlowFilter = (defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
    // Create glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
    return filter;
  };

  // Create clip paths for circular elements
  const createClipPath = (
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>, 
    id: string, 
    radius: number
  ) => {
    return defs.append("clipPath")
      .attr("id", id)
      .append("circle")
      .attr("r", radius);
  };

  return {
    createGlowFilter,
    createClipPath
  };
};
