
export interface NarrativeData {
  id: string;
  name: string;
  marketCap: number;
  volume24h: number;
  dominance: number;
  change24h: number;
  change7d: number;
  tokens: string[];
  color: string;
  // New field to store representative tokens with logo info
  representativeTokens?: RepresentativeToken[];
}

export interface RepresentativeToken {
  symbol: string;
  name: string;
  logoUrl: string;
}

export interface NarrativeFlow {
  from: string;
  to: string;
  value: number;
  percentage: number;
  predicted: boolean;
}

export interface ModelPrediction {
  narrativeFlows: NarrativeFlow[];
  timestamp: string;
  confidence: number;
}

import { BaseNode } from './nodes';

export interface NarrativeNode extends BaseNode {
  color: string;
  tokens: string[];
  attentionScore?: number; // Market attention score
  representativeTokens?: RepresentativeToken[]; // Representative tokens with logos
}
