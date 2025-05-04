
import { FlowData } from '@/types/crypto';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

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

export const fetchMarketData = async (timeframe: string): Promise<FlowData[]> => {
  try {
    // Add caching to prevent excessive API calls
    const cacheKey = `market-data-${timeframe}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheExpiry = sessionStorage.getItem(`${cacheKey}-expiry`);
    
    // Check if we have valid cached data (less than 5 minutes old)
    if (cachedData && cacheExpiry && Number(cacheExpiry) > Date.now()) {
      return JSON.parse(cachedData);
    }
    
    console.log('Fetching fresh market data...');
    // Increase per_page to 100 to capture top 100 cryptocurrencies
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h,7d,30d`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data: MarketData[] = await response.json();
    const btcData = data.find(coin => coin.symbol === 'btc');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    // Calculate flows between different categories
    const flows: FlowData[] = [];
    
    // BTC vs other major coins flows
    data.slice(0, 100).forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
        
        // Lower threshold to ensure we get more BTC flows
        if (Math.abs(relativeFlow) > 0.1) {
          flows.push({
            from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
            value: flowMagnitude,
            percentage: relativeFlow,
            marketCap: coin.market_cap,
            volume: coin.total_volume,
            name: coin.name,  // Add name for display
            change: coin.price_change_percentage_24h  // Add price change percentage
          });
        }
      }
    });
    
    // Also add flows between other top cryptocurrencies
    for (let i = 1; i < Math.min(data.length, 100); i++) {
      const coin = data[i];
      
      // Create node entry for all top 100 cryptocurrencies
      if (!flows.some(f => f.from === coin.symbol.toUpperCase() || f.to === coin.symbol.toUpperCase())) {
        // If no flows exist yet, create at least one flow to ensure the node appears
        const flowTarget = 'BTC';
        const flowValue = 0.1; // Small flow value
        flows.push({
          from: coin.symbol.toUpperCase(),
          to: flowTarget,
          value: flowValue,
          percentage: coin.market_cap_change_percentage_24h || 0,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          name: coin.name,  // Add name for display
          change: coin.price_change_percentage_24h  // Add price change percentage
        });
      }
    }
    
    // Add some flows between non-BTC cryptocurrencies
    for (let i = 1; i < Math.min(data.length - 1, 50); i++) {
      const coinA = data[i];
      const coinB = data[i + 1];
      
      if (coinA && coinB && coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
        const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        const flowMagnitude = (Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow)) / btcData.market_cap / 20;
        
        if (Math.abs(relativeFlow) > 0.5) {
          flows.push({
            from: relativeFlow > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
            value: flowMagnitude,
            percentage: relativeFlow,
            marketCap: Math.min(coinA.market_cap, coinB.market_cap),
            volume: Math.min(coinA.total_volume, coinB.total_volume),
            name: relativeFlow > 0 ? coinA.name : coinB.name,  // Add name for display
            change: relativeFlow > 0 ? coinA.price_change_percentage_24h : coinB.price_change_percentage_24h  // Add price change percentage
          });
        }
      }
    }
    
    // Set cache with 5-minute expiry
    sessionStorage.setItem(cacheKey, JSON.stringify(flows));
    sessionStorage.setItem(`${cacheKey}-expiry`, String(Date.now() + 5 * 60 * 1000));
    
    return flows;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};
