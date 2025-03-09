
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { useDrawVisualization } from './useDrawVisualization';
import { useNodeLogos } from './useNodeLogos';
import { useAnimationUpdates } from './useAnimationUpdates';

interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: any[];
  isPredicted: boolean;
  dragHandlers: any;
}

export const useFlowVisualization = () => {
  const { drawVisualization } = useDrawVisualization();
  const { addNodeLogos, addNodeLabels } = useNodeLogos();
  const { updatePositions } = useAnimationUpdates();
  
  // Create visual elements for the flow visualization
  const createVisualization = (options: DrawOptions) => {
    const elements = drawVisualization(options);
    const { node, svg } = elements;
    
    // Add logos and labels to nodes
    addNodeLogos(node, svg);
    addNodeLabels(node);

    return elements;
  };

  return {
    drawVisualization: createVisualization,
    updatePositions
  };
};
