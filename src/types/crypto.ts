
export interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
  ema12?: number;
  ema26?: number;
  aboveMA14?: boolean;
  price?: string;
  volume?: string;
  high24h?: string;
  low24h?: string;
  symbol?: string; // Added symbol property
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  obv?: number;
  score?: number;
  isExplosive?: boolean;
  criteriaHit?: string[];
  marketCap?: number; // Added marketCap property
  category?: string; // Added category property for filtering by type
}

export interface FlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
  volume?: number; // Volume property for FlowData interface
  marketCap?: number; // Added marketCap property
  name?: string; // Added name property to resolve error
  change?: number; // Added change property to resolve error
  category?: string; // Added category for filtering purposes
  fromCategory?: string; // Source node category
  toCategory?: string; // Target node category
}
