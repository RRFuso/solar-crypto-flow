
export const useFiltersAndEffects = () => {
  // Create filter effects for the visualization using native DOM methods
  const createGlowFilter = (defs: any) => {
    // Create glow filter
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "3");
    feGaussianBlur.setAttribute("result", "coloredBlur");
    filter.appendChild(feGaussianBlur);

    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feMerge);
    
    defs.append(filter);
    return filter;
  };

  // Create clip paths for circular elements
  const createClipPath = (defs: any, id: string, radius: number) => {
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", id);
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", radius.toString());
    clipPath.appendChild(circle);
    
    defs.append(clipPath);
    return clipPath;
  };

  return {
    createGlowFilter,
    createClipPath
  };
};
