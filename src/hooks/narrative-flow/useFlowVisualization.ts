
import { useFiltersAndEffects } from './visualization/useFiltersAndEffects';
import { useLinks } from './visualization/useLinks';
import { useNodeElements } from './visualization/useNodeElements';
import { useOrbitalPaths } from './visualization/useOrbitalPaths';
import { useOrbitalAnimation } from './visualization/useOrbitalAnimation';
import { DrawOptions, VisualizationElements } from './visualization/types';

export const useFlowVisualization = () => {
  const { createGlowFilter } = useFiltersAndEffects();
  const { createLinks, updateLinkPaths, updateFlowParticles } = useLinks();
  const { createNodes, updateNodePositions } = useNodeElements();
  const { createOrbitalPaths } = useOrbitalPaths();
  const { setupOrbitalAnimation, createStarfield } = useOrbitalAnimation();

  // Create visual elements for the flow visualization without d3
  const drawVisualization = (options: DrawOptions): VisualizationElements => {
    const { svg, nodes, links, isPredicted, dragHandlers } = options;
    
    // Create SVG using native DOM methods
    const svgElement = svg.node() || svg;
    
    // Create defs for glows and clip paths
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgElement.appendChild(defs);
    createGlowFilter({ append: (el: any) => defs.appendChild(el) } as any);
    
    // Get dimensions
    const width = parseInt(svgElement.getAttribute("width") || "800");
    const height = parseInt(svgElement.getAttribute("height") || "600");
    
    // Add starfield background
    createStarfield({ append: (el: any) => svgElement.appendChild(el) } as any, width, height);
    
    // Create orbital paths
    createOrbitalPaths({ append: (el: any) => svgElement.appendChild(el) } as any, nodes, width, height);
    
    // Draw links with curved paths and particles
    const { link } = createLinks({ append: (el: any) => svgElement.appendChild(el) } as any, links, isPredicted);
    
    // Add nodes, glows, logos, and labels
    const { node } = createNodes({ append: (el: any) => svgElement.appendChild(el) } as any, nodes, dragHandlers, { append: (el: any) => defs.appendChild(el) } as any);
    
    // Setup element references
    const elements: VisualizationElements = { link, node, svg: { node: () => svgElement } as any };
    
    // Setup animation
    const animationFrameId = setupOrbitalAnimation(elements, nodes);
    elements.animationFrameId = animationFrameId;

    return elements;
  };

  // Update element positions on tick
  const updatePositions = (elements: VisualizationElements, nodes: any[], links: any[]) => {
    const { link, node, svg } = elements;
    
    // Update link paths
    updateLinkPaths(link);

    // Update flow particles
    updateFlowParticles(svg, links);

    // Update node positions
    updateNodePositions(node);
  };

  return {
    drawVisualization,
    updatePositions
  };
};
