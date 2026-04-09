
import { FlowData } from '@/types/crypto';
import { fetchTickers } from './binance';
import { BinanceTicker } from '@/types/binance';

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

// Optimized function with column selection and Gzip compression
export const fetchMarketDataOptimized = async (timeframe: string): Promise<FlowData[]> => {
  try {
    const cacheKey = `market-data-optimized-${timeframe}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheExpiry = sessionStorage.getItem(`${cacheKey}-expiry`);
    
    if (cachedData && cacheExpiry && Number(cacheExpiry) > Date.now()) {
      return JSON.parse(cachedData);
    }
    
    console.log('[Optimized] Fetching market data with Gzip compression...');
    
    // Fetch with Gzip compression and only necessary fields
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&sparkline=false&price_change_percentage=24h`,
      {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data: MarketData[] = await response.json();
    
    console.log('[Optimized] Response size:', 
      response.headers.get('content-length') || 'unknown',
      'bytes | Compression:',
      response.headers.get('content-encoding') || 'none'
    );
    
    const btcData = data.find(coin => coin.symbol === 'btc');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    // Calculate flows between different categories
    const flows: FlowData[] = [];
    
    // BTC vs other major coins flows - using all 250 coins
    data.forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
        
        // Lower threshold to ensure we get more BTC flows
        if (Math.abs(relativeFlow) > 0.1) {
          flows.push({
            id: `btc-${coin.symbol}`,
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
    for (let i = 1; i < Math.min(data.length, 250); i++) {
      const coin = data[i];
      
      // Create node entry for all cryptocurrencies
      if (!flows.some(f => f.from === coin.symbol.toUpperCase() || f.to === coin.symbol.toUpperCase())) {
        // If no flows exist yet, create at least one flow to ensure the node appears
        const flowTarget = 'BTC';
        const flowValue = 0.1; // Small flow value
        flows.push({
          id: `${coin.symbol}-btc-default`,
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
    
    // Add some flows between non-BTC cryptocurrencies - increased to 100 pairs
    for (let i = 1; i < Math.min(data.length - 1, 100); i++) {
      const coinA = data[i];
      const coinB = data[i + 1];
      
      if (coinA && coinB && coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
        const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        const flowMagnitude = (Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow)) / btcData.market_cap / 20;
        
        if (Math.abs(relativeFlow) > 0.5) {
          flows.push({
            id: `${coinA.symbol}-${coinB.symbol}`,
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

// Backwards compatibility alias
export const fetchMarketDataCoinGecko = fetchMarketDataOptimized;
