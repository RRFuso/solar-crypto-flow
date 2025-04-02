
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
}

export interface FlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
  volume?: number; // Add volume property to FlowData interface
}
