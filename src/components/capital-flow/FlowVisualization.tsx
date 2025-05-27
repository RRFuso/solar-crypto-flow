
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { PredictionOrbitalOverlay } from './PredictionOrbitalOverlay';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 40,
  predictions = [],
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
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Initialize visualization data
  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel: zoomLevel * 1.15, // Increase node size by 15%
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory
  });

  // Listen for node click events to update selected node
  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      
      // Toggle selection if clicking the same node, otherwise select the new node
      setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
      
      // Update visualization data with new selected node
      setVisualizationData(prevData => ({
        ...prevData,
        selectedNodeId: prevData.selectedNodeId === nodeId ? null : nodeId
      }));
    };
    
    // Add event listener
    document.addEventListener('node-click', handleNodeClick as EventListener);
    
    // Remove event listener on cleanup
    return () => {
      document.removeEventListener('node-click', handleNodeClick as EventListener);
    };
  }, [setVisualizationData]);

  // Force initial rendering of links when component loads
  useEffect(() => {
    if (flowData && flowData.length > 0 && svgRef.current && dimensions.width > 0) {
      // Force initialization of visualization with default timeframe
      if (animationRef.current === null && visualizationData.nodes.length > 0) {
        console.log("Forcing initial link rendering with default timeframe");
        
        // Ensure links are rendered by manually triggering a render if needed
        if (visualizationData.links.length > 0 && svgRef.current) {
          const svg = d3.select(svgRef.current);
          
          // If links group doesn't exist or is empty, trigger the link renderer
          if (svg.select('.flow-links').empty() || svg.select('.flow-links').selectAll('*').empty()) {
            console.log("Manually triggering link rendering");
            
            // This will force the LinkRendererExtended component to render
            setVisualizationData(prevData => ({
              ...prevData,
              // Adding a timestamp forces the renderer to update
              lastUpdate: new Date().getTime()
            }));
          }
        }
      }
    }
  }, [flowData, dimensions, visualizationData, animationRef]);

  // Get color based on category from backend
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "🚀 Alta":
        return "#00FF88"; // Bright green
      case "🏃 Fuga":
        return "#FF3366"; // Bright red
      case "🧱 Acum.":
        return "#FFCC00"; // Yellow
      case "🔁 Rev.":
        return "#00CCFF"; // Bright blue
      case "⚠️ Alert":
        return "#FF9900"; // Orange
      case "Neutro":
      default:
        return "#8A9196"; // Neutral gray
    }
  };

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
        <p className="text-gray-400">No flow data available</p>
      </div>
    );
  }

  // Only render the visualization components if we have the SVG and data
  const renderVisualization = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />
      {renderVisualization && svgRef.current && (
        <>
          {/* Add starfield background */}
          <StarfieldBackground 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
          />
          
          {/* Render orbital visualization components */}
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={34.5 * (zoomLevel / 100) * 1.15} // Increase orbital radius by 15%
            extendFullScreen={true} // Extend orbit lines to full screen
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true} // Enable orbital animation for links
            getCategoryColor={getCategoryColor} // Pass the color function
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel * 1.25} // Increase node size by 25%
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00012} // Faster rotation (increased from 0.00004)
            updateLinksInRealTime={true} // Update links with orbital movement
          />
          
          {/* Add AI predictions overlay */}
          {predictions && predictions.length > 0 && (
            <PredictionOrbitalOverlay
              svg={d3.select(svgRef.current)}
              nodes={visualizationData.nodes}
              updateInterval={600000} // Update every 10 minutes
              predictions={predictions}
              chartTimeframe={chartTimeframe}
            />
          )}
        </>
      )}
    </div>
  );
};
