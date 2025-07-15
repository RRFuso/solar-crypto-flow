import { BaseNode } from './nodes';

export interface MarketIndex extends BaseNode {
  symbol: string;
  color: string;
  change?: number;
  marketCap?: number;
  volume?: number;
  isCentral?: boolean;
  tokens?: string[];
}

export interface IndexFlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
}

export interface IndexRotationResult {
  indices: MarketIndex[];
  flows: IndexFlowData[];
  timestamp: string;
  period: string;
}

export interface IndexLinkData {
  source: { x: number, y: number, id: string };
  target: { x: number, y: number, id: string };
  value: number;
  percentage: number;
  markerId: string;
}