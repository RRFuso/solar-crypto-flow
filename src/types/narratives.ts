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

export interface NarrativeNode {
  id: string;
  name: string;
  value: number;
  color: string;
  tokens: string[];
  x: number;
  y: number;
  radius: number;
  fx: number | null;
  fy: number | null;
}
