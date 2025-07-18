
import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeData } from '@/types/narratives';
import { useNodeSizing } from './narrative-flow/useNodeSizing';
import { useSimulation } from './narrative-flow/useSimulation';
import { useFlowVisualization } from './narrative-flow/useFlowVisualization';

interface VisualizationConfig {
  width: number;
  height: number;
  narratives: NarrativeData[];
  flowData: NarrativeFlow[];
  isPredicted: boolean;
}

export const useNarrativeFlowVisualization = (
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  config: VisualizationConfig
) => {
  const { width, height, narratives, flowData, isPredicted } = config;
  
  // Use our custom hooks to create and prepare nodes
  const { createNodes, scaleNodeSizes } = useNodeSizing(narratives);
  const nodes = createNodes(flowData);
  scaleNodeSizes(nodes);
  
  // Create links from flow data
  const links = flowData.map(flow => ({
    source: nodes.find(n => n.id === flow.from),
    target: nodes.find(n => n.id === flow.to),
    value: flow.value,
    percentage: flow.percentage,
    predicted: flow.predicted
  }));

  // Create a mock crypto data map for backward compatibility
  const cryptoDataMap = new Map();
  nodes.forEach(node => {
    cryptoDataMap.set(node.id, {
      marketCap: node.value || 0,
      price: 0,
      volume: 0,
      change24h: 0
    });
  });

  // Call useSimulation at the top level
  const { simulation, positionNodes, applyBounds, dragHandlers } = useSimulation({
    nodes,
    links,
    cryptoDataMap,
    width,
    height,
  });