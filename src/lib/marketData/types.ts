
import { FlowData } from '@/types/crypto';

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  market_cap_change_percentage_24h: number;
  total_volume: number;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
}

export interface CoinGeckoResponse extends MarketData {
  // Additional fields that might be returned by the CoinGecko API
}
