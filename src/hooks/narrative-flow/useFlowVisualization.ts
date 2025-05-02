
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

  // Create visual elements for the flow visualization
  const drawVisualization = (options: DrawOptions): VisualizationElements => {
    const { svg, nodes, links, isPredicted, dragHandlers } = options;
    
    // Create defs for glows and clip paths
    const defs = svg.append("defs");
    createGlowFilter(defs);
    
    // Get dimensions
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));
    
    // Add starfield background
    createStarfield(svg, width, height);
    
    // Create orbital paths
    createOrbitalPaths(svg, nodes, width, height);
    
    // Draw links with curved paths and particles
    const { link } = createLinks(svg, links, isPredicted);
    
    // Add nodes, glows, logos, and labels
    const { node } = createNodes(svg, nodes, dragHandlers, defs);
    
    // Setup element references
    const elements: VisualizationElements = { link, node, svg };
    
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
