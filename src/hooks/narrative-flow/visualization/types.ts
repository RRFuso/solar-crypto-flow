
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

export interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: any[];
  isPredicted: boolean;
  dragHandlers: any;
}

export interface VisualizationElements {
  link: d3.Selection<SVGPathElement, any, SVGGElement, unknown>;
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
