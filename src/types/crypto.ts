export interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
  aboveMA14?: boolean;
  price?: string;
  volume?: string;
  high24h?: string;
  low24h?: string;
}