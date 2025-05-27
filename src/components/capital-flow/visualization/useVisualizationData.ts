import { useEffect } from 'react';
import { FlowData } from '@/types/crypto';
import { useRef } from 'react';
import { OrbitalNode } from '../NodePlacement';

interface UseVisualizationDataProps {
  flowData: FlowData[];
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number; height: number };
  zoomLevel: number;
  setVisualizationData: (data: {
    nodes: OrbitalNode[];
    links: any[];
    centralNode: OrbitalNode | null;
    selectedNodeId: string | null;
  }) => void;
  animationRef: React.MutableRefObject<any>;
  createOrbitalVisualization: (
    flowData: FlowData[],
    svgElement: SVGSVGElement,
    width: number,
    height: number
  ) => {
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    width: number;
    height: number;
    nodes: OrbitalNode[];
    links: any[];
    centralNode: OrbitalNode | null;
  };
}

export const useVisualizationData = ({
  flowData,
  svgRef,
  dimensions,
  zoomLevel,
  setVisualizationData,
  animationRef,
  createOrbitalVisualization
}: UseVisualizationDataProps) => {
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const vis = createOrbitalVisualization(flowData, svgRef.current, dimensions.width, dimensions.height);
    setVisualizationData({
      nodes: vis.nodes,
      links: vis.links,
      centralNode: vis.centralNode,
      selectedNodeId: null
    });

    animationRef.current = {
      nodes: vis.nodes,
      width: vis.width,
      height: vis.height,
      zoomLevel
    };
  }, [flowData, dimensions, zoomLevel]);
};
