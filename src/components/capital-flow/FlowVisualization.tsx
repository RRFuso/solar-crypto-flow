import React from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererComponent } from './LinkRenderer';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { PredictionOrbitalOverlay } from './PredictionOrbitalOverlay';
import { usePredictions } from '@/hooks/usePredictions';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  selectedCategory?: string;
  chartTimeframe?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  flowData,
  zoomLevel = 70,
  selectedCategory = 'all',
  chartTimeframe = '4h',
}) => {
  const {
    svgRef,
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
  } = useVisualizationSetup(flowData, zoomLevel);

  const { predictions } = usePredictions(flowData, selectedCategory, chartTimeframe);

  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
  });

  if (!flowData || flowData.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: '700px' }}
      >
        <p className="text-gray-400">No flow data available</p>
      </div>
    );
  }

  const render = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '700px' }}>
      <svg ref={svgRef} className="w-full h-full" />
      {render && svgRef.current && (
        <>
          <StarfieldBackground
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
          />
          <OrbitLayersComponent
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={30 * (zoomLevel / 100)}
            extendFullScreen
          />
          <LinkRendererComponent
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
          />
          <NodeRendererComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel}
          />
          <OrbitalAnimationComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
          />
          <PredictionOrbitalOverlay
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            predictions={predictions}
            zoomLevel={zoomLevel}
          />
        </>
      )}
    </div>
  );
};
