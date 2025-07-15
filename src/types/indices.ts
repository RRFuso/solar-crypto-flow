// Market indices types
export interface MarketIndex {
  id: string;
  name: string;
  symbol?: string;
  value: number;
  change: number;
  changePercent: number;
  color: string;
  category: string;
  marketCap?: number;
  volume?: number;
  timestamp?: string;
  x?: number;  // Add x coordinate for D3 simulations
  y?: number;  // Add y coordinate for D3 simulations
  isCentral?: boolean;  // Add isCentral flag
  radius?: number; // Add radius for visualization
  fx?: any; // Add fx for D3 force simulation
  fy?: any; // Add fy for D3 force simulation
  tokens?: any[]; // Add tokens property
  inflow?: number; // Add inflow for flow calculations
  outflow?: number; // Add outflow for flow calculations
}

export interface IndexFlowData {
  id: string;
  from: string;
  to: string;
  value: number;
  percentage: number;
  volume?: number;
  change?: number;
  category?: string;
  name?: string;
  color?: string;
}

export interface IndexLinkData extends IndexFlowData {
  source?: MarketIndex;
  target?: MarketIndex;
}

export interface IndexRotationResult {
  indices: MarketIndex[];
  flows: IndexFlowData[];
  timestamp: string;
  totalVolume: number;
  strongestFlow?: IndexFlowData;
  weakestFlow?: IndexFlowData;
  period?: string; // Add period property
}

export interface IndexVisualizationData {
  nodes: MarketIndex[];
  links: IndexFlowData[];
}