
export interface MarketIndex {
  id: string;
  name: string;
  symbol: string;
  color: string;
  value?: number;
  change?: number;
  marketCap?: number;
  volume?: number;
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
