
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

export interface NarrativeLink {
  source: NarrativeNode;
  target: NarrativeNode;
  value: number;
  percentage: number;
  predicted?: boolean;
}

export interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: NarrativeLink[];
  isPredicted: boolean;
  dragHandlers: {
    dragstarted: (event: d3.D3DragEvent<SVGCircleElement, NarrativeNode, NarrativeNode>) => void;
    dragged: (event: d3.D3DragEvent<SVGCircleElement, NarrativeNode, NarrativeNode>) => void;
    dragended: (event: d3.D3DragEvent<SVGCircleElement, NarrativeNode, NarrativeNode>) => void;
  };
}

export interface VisualizationElements {
  link: d3.Selection<SVGPathElement, NarrativeLink, SVGGElement, unknown>;
  node: d3.Selection<SVGGElement, NarrativeNode, SVGGElement, unknown>;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  animationFrameId?: number;
}

export interface TokenLogo {
  symbol: string;
  x: number;
  y: number;
  radius: number;
}
