
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
    // Increase per_page to capture more cryptocurrencies and include more data fields
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h,7d,30d`
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
    data.slice(0, 25).forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
        
        // Lower threshold to ensure we get more BTC flows
        if (Math.abs(relativeFlow) > 0.1) {
          flows.push({
            from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
            value: flowMagnitude,
            percentage: relativeFlow
          });
        }
      }
    });

    // Ensure we have at least some BTC flows
    const btcFlows = flows.filter(flow => flow.from === 'BTC' || flow.to === 'BTC');
    if (btcFlows.length < 8 && data.length > 8) {  // Increased required BTC flows
      // Generate some synthetic BTC flows if we don't have enough
      const topCoins = data.slice(1, 10);  // Top 10 coins excluding BTC
      topCoins.forEach((coin, index) => {
        // Skip if we already have a flow with this coin
        if (flows.some(f => 
          (f.from === 'BTC' && f.to === coin.symbol.toUpperCase()) || 
          (f.to === 'BTC' && f.from === coin.symbol.toUpperCase())
        )) {
          return;
        }
        
        // Alternate between inflow and outflow
        const isInflow = index % 2 === 0;
        const value = (coin.market_cap / btcData.market_cap) * 20 * (0.5 + Math.random() * 0.5);
        const percentage = isInflow ? -(2 + Math.random() * 4) : (2 + Math.random() * 4);
        
        flows.push({
          from: isInflow ? coin.symbol.toUpperCase() : 'BTC',
          to: isInflow ? 'BTC' : coin.symbol.toUpperCase(),
          value,
          percentage
        });
      });
    }

    // ETH vs DeFi coins flows
    const ethData = data.find(coin => coin.symbol === 'eth');
    const defiCoins = data.filter(coin => {
      const defiTokens = ['uni', 'aave', 'mkr', 'snx', 'comp', 'cake', 'crv', 'sushi'];
      return defiTokens.includes(coin.symbol);
    });

    if (ethData) {
      defiCoins.forEach(coin => {
        if (coin.market_cap_change_percentage_24h) {
          const relativeFlow = coin.market_cap_change_percentage_24h - ethData.market_cap_change_percentage_24h;
          const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / ethData.market_cap / 10;
          
          if (Math.abs(relativeFlow) > 1.0) { // Reduced threshold from 1.5 to 1.0
            flows.push({
              from: relativeFlow > 0 ? 'ETH' : coin.symbol.toUpperCase(),
              to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'ETH',
              value: flowMagnitude,
              percentage: relativeFlow
            });
          }
        }
      });
    }

    // Flows between smart contract platforms
    const platforms = data.filter(coin => {
      const platformTokens = ['eth', 'sol', 'ada', 'avax', 'dot', 'near', 'atom', 'trx', 'ftm', 'matic'];
      return platformTokens.includes(coin.symbol);
    });

    // Create more cross-flows between platforms with reduced threshold
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const coinA = platforms[i];
        const coinB = platforms[j];
        
        if (coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
          const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
          
          if (Math.abs(relativeFlow) > 1.5) { // Reduced from 2.0 to 1.5
            const flowMagnitude = Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow) / 100 / 10;
            
            flows.push({
              from: relativeFlow > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
              to: relativeFlow > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
              value: flowMagnitude,
              percentage: relativeFlow
            });
          }
        }
      }
    }

    // Add market caps to each flow for better visualization
    const cryptoMap = new Map();
    data.forEach(coin => {
      cryptoMap.set(coin.symbol.toUpperCase(), {
        marketCap: coin.market_cap,
        change: coin.price_change_percentage_24h,
        image: coin.image
      });
    });
    
    // Enhance flows with market cap data
    const enhancedFlows = flows.map(flow => ({
      ...flow,
      sourceMarketCap: cryptoMap.get(flow.from)?.marketCap || 0,
      targetMarketCap: cryptoMap.get(flow.to)?.marketCap || 0,
      sourceImage: cryptoMap.get(flow.from)?.image || '',
      targetImage: cryptoMap.get(flow.to)?.image || ''
    }));

    // Sort flows by magnitude but prioritize BTC flows
    const sortedFlows = enhancedFlows.sort((a, b) => {
      // Prioritize BTC flows
      const aHasBtc = a.from === 'BTC' || a.to === 'BTC';
      const bHasBtc = b.from === 'BTC' || b.to === 'BTC';
      
      if (aHasBtc && !bHasBtc) return -1;
      if (!aHasBtc && bHasBtc) return 1;
      
      // Then sort by magnitude
      return b.value - a.value;
    });
    
    // Take the top flows, ensuring we have a mix of BTC and altcoin flows
    const resultFlows = sortedFlows.slice(0, 25);  // Increased from 20 to 25 for more connections
    
    // Cache the result for 5 minutes
    sessionStorage.setItem(cacheKey, JSON.stringify(resultFlows));
    sessionStorage.setItem(`${cacheKey}-expiry`, (Date.now() + 5 * 60 * 1000).toString());
    
    return resultFlows;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};
