
import { FlowData } from '@/types/crypto';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface MarketData {
  id: string;
  symbol: string;
  market_cap: number;
  market_cap_change_percentage_24h: number;
  total_volume: number;
}

export const fetchMarketData = async (timeframe: string): Promise<FlowData[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=24h,7d,30d`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Adding cache control to respect rate limits
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
    const btcData = data.find(coin => coin.symbol === 'btc');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    // Calculate relative flows against BTC
    const flows: FlowData[] = [];
    
    data.forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap;
        
        if (Math.abs(relativeFlow) > 1) { // Only show significant flows
          flows.push({
            from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
            value: flowMagnitude,
            percentage: relativeFlow
          });
        }
      }
    });

    // Sort by flow magnitude and limit to top 5
    return flows.sort((a, b) => b.value - a.value).slice(0, 5);
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error; // Re-throw to be handled by React Query
  }
};
