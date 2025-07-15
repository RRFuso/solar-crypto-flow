import { BaseNode } from './nodes';

export interface CapitalFlowNode extends BaseNode {
  marketCap?: number;
}

export interface CapitalFlowLink {
  source: CapitalFlowNode;
  target: CapitalFlowNode;
  value: number;
  percentage: number;
}

export interface LinkData extends CapitalFlowLink {
  markerId: string;
  predictionColor: string | null;
  isHighlighted: boolean;
  fromCategory?: string;
}