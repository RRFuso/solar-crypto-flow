
import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import PredictionOrbitalOverlay from './PredictionOrbitalOverlay';

interface FlowVisualizationProps {
  flowData: FlowData[];
  predictions?: Prediction[];
  zoomLevel?: number;
  chartTimeframe?: string;
  activeCategory?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  flowData,
  predictions = [],
  zoomLevel = 50,
  chartTimeframe = '4h',
  activeCategory = 'all'
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

  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory
  });

  return (
    <div ref={containerRef} className="w-full h-full min-h-[700px] relative">
      <svg ref={svgRef} className="w-full h-full" />
      {dimensions.width > 0 && visualizationData.nodes.length > 0 && (
        <>
          <OrbitLayersComponent
            svg={d3.select(svgRef.current!)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={35 * (zoomLevel / 100)}
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current!)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
            predictions={predictions}
            animateWithOrbit
            getCategoryColor={() => '#888'}
          />
          <NodeRendererComponent
            svg={d3.select(svgRef.current!)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode!}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel}
          />
          <OrbitalAnimationComponent
            svg={d3.select(svgRef.current!)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.0001}
            updateLinksInRealTime
          />
          <PredictionOrbitalOverlay
            svg={d3.select(svgRef.current!)}
            nodes={visualizationData.nodes}
            predictions={predictions}
          />
        </>
      )}
    </div>
  );
};

export default FlowVisualization;
