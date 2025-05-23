
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { NodeRendererComponent } from './NodeRenderer';
import { LinkRendererExtended } from './LinkRendererExtended';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import PredictionOrbitalOverlay from '../ai/PredictionOrbitalOverlay';

interface FlowVisualizationProps {
  flowData: FlowData[];
  predictions?: Prediction[];
  zoomLevel?: number;
  chartTimeframe?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  flowData,
  predictions = [],
  zoomLevel = 40,
  chartTimeframe = '4h'
}) => {
  const {
    svgRef,
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization
  } = useVisualizationSetup(flowData, zoomLevel);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization
  });

  // Handle node click
  useEffect(() => {
    const handleClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
      setVisualizationData(prev => ({
        ...prev,
        selectedNodeId: prev.selectedNodeId === nodeId ? null : nodeId
      }));
    };

    document.addEventListener('node-click', handleClick as EventListener);
    return () => document.removeEventListener('node-click', handleClick as EventListener);
  }, []);

  if (!flowData.length || !svgRef.current || !dimensions.width || !visualizationData.nodes.length) {
    return <div ref={containerRef} className="w-full h-full text-gray-500 p-8">Loading visualization...</div>;
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      <NodeRendererComponent
        svg={d3.select(svgRef.current)}
        nodes={visualizationData.nodes}
        centralNode={visualizationData.centralNode}
        selectedNodeId={visualizationData.selectedNodeId}
      />

      <LinkRendererExtended
        svg={d3.select(svgRef.current)}
        links={visualizationData.links}
        selectedNodeId={visualizationData.selectedNodeId}
        predictions={predictions}
      />

      <OrbitalAnimationComponent
        svg={d3.select(svgRef.current)}
        nodes={visualizationData.nodes}
        width={dimensions.width}
        height={dimensions.height}
        rotationSpeed={0.0001}
      />

      <PredictionOrbitalOverlay
        svg={d3.select(svgRef.current)}
        nodes={visualizationData.nodes}
        predictions={predictions}
      />
    </div>
  );
};
