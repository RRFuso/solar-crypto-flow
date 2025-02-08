
import { FlowData } from '@/types/crypto';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface MarketData {
  id: string;
  symbol: string;
  market_cap: number;
  market_cap_change_percentage_24h: number;
  total_volume: number;
}

interface MarketCapCategory {
  marketCap: number;
  change: number;
}

function calculateMarketCapCategories(data: MarketData[]) {
  const btc = data.find(coin => coin.symbol === 'btc');
  const sortedByMarketCap = data.sort((a, b) => b.market_cap - a.market_cap);
  
  const largeCaps = sortedByMarketCap.slice(1, 10);
  const midCaps = sortedByMarketCap.slice(10, 50);
  const smallCaps = sortedByMarketCap.slice(50);

  const categories = {
    btc: {
      marketCap: btc?.market_cap || 0,
      change: btc?.market_cap_change_percentage_24h || 0
    },
    largeCaps: {
      marketCap: largeCaps.reduce((sum, coin) => sum + coin.market_cap, 0),
      change: largeCaps.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / largeCaps.length
    },
    midCaps: {
      marketCap: midCaps.reduce((sum, coin) => sum + coin.market_cap, 0),
      change: midCaps.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / midCaps.length
    },
    smallCaps: {
      marketCap: smallCaps.reduce((sum, coin) => sum + coin.market_cap, 0),
      change: smallCaps.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / smallCaps.length
    }
  };

  return categories;
}

function detectCapitalFlows(categories: Record<string, MarketCapCategory>): FlowData[] {
  const flows: FlowData[] = [];
  const threshold = 0.5; // Minimum percentage difference to consider a flow

  // BTC to Large Caps
  if (categories.btc.change < -threshold && categories.largeCaps.change > threshold) {
    flows.push({
      from: 'BTC',
      to: 'Large Caps',
      value: Math.abs(categories.btc.marketCap * categories.btc.change / 100),
      percentage: categories.largeCaps.change - categories.btc.change
    });
  }

  // Large Caps to Mid Caps
  if (categories.largeCaps.change < -threshold && categories.midCaps.change > threshold) {
    flows.push({
      from: 'Large Caps',
      to: 'Mid Caps',
      value: Math.abs(categories.largeCaps.marketCap * categories.largeCaps.change / 100),
      percentage: categories.midCaps.change - categories.largeCaps.change
    });
  }

  // Mid Caps to Small Caps
  if (categories.midCaps.change < -threshold && categories.smallCaps.change > threshold) {
    flows.push({
      from: 'Mid Caps',
      to: 'Small Caps',
      value: Math.abs(categories.midCaps.marketCap * categories.midCaps.change / 100),
      percentage: categories.smallCaps.change - categories.midCaps.change
    });
  }

  // Flow back to BTC
  const altcoinsChange = (categories.largeCaps.change + categories.midCaps.change + categories.smallCaps.change) / 3;
  if (altcoinsChange < -threshold && categories.btc.change > threshold) {
    flows.push({
      from: 'Altcoins',
      to: 'BTC',
      value: Math.abs(categories.btc.marketCap * categories.btc.change / 100),
      percentage: categories.btc.change - altcoinsChange
    });
  }

  return flows;
}

export const fetchMarketData = async (timeframe: string): Promise<FlowData[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h,7d,30d`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'force-cache',
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MarketData[] = await response.json();
    const categories = calculateMarketCapCategories(data);
    const flows = detectCapitalFlows(categories);
    
    // Sort by flow magnitude and limit to significant flows
    return flows
      .sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage))
      .filter(flow => Math.abs(flow.percentage) > 1)
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};
