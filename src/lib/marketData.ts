

import { FlowData } from '@/types/crypto';
import { fetchTickers } from './binance';
import { BinanceTicker } from '@/types/binance';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const COINGECKO_PROXY = `${SUPABASE_URL}/functions/v1/coingecko-proxy`;

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap: number;
  market_cap_change_percentage_24h: number;
  total_volume: number;
  current_price: number;
  price_change_percentage_24h: number;
}

export const fetchMarketDataCoinGecko = async (timeframe: string): Promise<FlowData[]> => {
  try {
    console.log('Fetching fresh market data...');
    const response = await fetch(
      `${COINGECKO_PROXY}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h,7d,30d`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data: MarketData[] = await response.json();
    const btcData = data.find(coin => coin.symbol === 'btc');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    const flows: FlowData[] = [];
    
    data.slice(0, 100).forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
        
        if (Math.abs(relativeFlow) > 0.1) {
          flows.push({
            id: `btc-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
            value: flowMagnitude,
            percentage: relativeFlow,
            marketCap: coin.market_cap,
            volume: coin.total_volume,
            name: coin.name,
            change: coin.price_change_percentage_24h
          });
        }
      }
    });
    
    for (let i = 1; i < Math.min(data.length, 100); i++) {
      const coin = data[i];
      
      if (!flows.some(f => f.from === coin.symbol.toUpperCase() || f.to === coin.symbol.toUpperCase())) {
        const flowTarget = 'BTC';
        const flowValue = 0.1;
        flows.push({
          id: `${coin.symbol}-btc-default-${Date.now()}-${i}`,
          from: coin.symbol.toUpperCase(),
          to: flowTarget,
          value: flowValue,
          percentage: coin.market_cap_change_percentage_24h || 0,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          name: coin.name,
          change: coin.price_change_percentage_24h
        });
      }
    }
    
    for (let i = 1; i < Math.min(data.length - 1, 50); i++) {
      const coinA = data[i];
      const coinB = data[i + 1];
      
      if (coinA && coinB && coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
        const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        const flowMagnitude = (Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow)) / btcData.market_cap / 20;
        
        if (Math.abs(relativeFlow) > 0.5) {
          flows.push({
            id: `${coinA.symbol}-${coinB.symbol}-${Date.now()}-${i}`,
            from: relativeFlow > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
            value: flowMagnitude,
            percentage: relativeFlow,
            marketCap: Math.min(coinA.market_cap, coinB.market_cap),
            volume: Math.min(coinA.total_volume, coinB.total_volume),
            name: relativeFlow > 0 ? coinA.name : coinB.name,
            change: relativeFlow > 0 ? coinA.price_change_percentage_24h : coinB.price_change_percentage_24h
          });
        }
      }
    }
    
    return flows;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};

export const fetchMarketDataBinance = async (): Promise<FlowData[]> => {
  try {
    const tickers = await fetchTickers();
    const flows: FlowData[] = [];

    // For simplicity, let's create some dummy flows based on Binance tickers
    // In a real scenario, you'd need more sophisticated logic to determine flows
    Object.values(tickers).forEach(ticker => {
      if (ticker.symbol.endsWith('USDT') && parseFloat(ticker.quoteVolume) > 1000000) { // Filter for USDT pairs with significant volume
        flows.push({
          id: ticker.symbol, // Using symbol as ID
          from: 'USD', // Assuming flow from USD
          to: ticker.symbol.replace('USDT', ''), // Crypto symbol
          value: parseFloat(ticker.quoteVolume) * 0.01, // Dummy value based on volume
          percentage: parseFloat(ticker.priceChangePercent), // Price change as percentage
          marketCap: parseFloat(ticker.quoteVolume), // Using quoteVolume as market cap approximation
          volume: parseFloat(ticker.volume),
          name: ticker.symbol.replace('USDT', ''),
          change: parseFloat(ticker.priceChangePercent),
        });
      }
    });
    return flows;
  } catch (error) {
    console.error('Error fetching Binance market data:', error);
    return [];
  }
};
