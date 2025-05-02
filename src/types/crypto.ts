
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
  symbol?: string;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  obv?: number;
  score?: number;
  isExplosive?: boolean;
  criteriaHit?: string[];
  marketCap?: number;
  category?: string;
  categories?: string[];
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volumeChange24h?: number;
}

export interface FlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
  volume?: number;
  marketCap?: number;
  name?: string;
  change?: number;
  category?: string;
  fromCategory?: string;
  toCategory?: string;
  predictionColor?: string;
  categories?: string[];
}
