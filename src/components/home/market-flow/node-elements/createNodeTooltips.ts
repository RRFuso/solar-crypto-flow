
import { formatValue } from './utils';

export const createNodeTooltips = (
  svg: any,
  node: SVGGElement[]
) => {
  // Add tooltips on hover using native DOM methods
  node.forEach((nodeElement, index) => {
    nodeElement.addEventListener("mouseover", function(event) {
      // Simple tooltip implementation
      console.log("Node hovered:", nodeElement);
    });
    
    nodeElement.addEventListener("mouseout", function() {
      // Remove tooltip
      const tooltips = svg.querySelectorAll(".tooltip");
      tooltips.forEach((tooltip: Element) => tooltip.remove());
    });
  });

  return node;
};
