
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
  dragHandlers: any;
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
