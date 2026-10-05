
import { FlowData } from '@/types/crypto';
import { COINGECKO_API, MAX_FLOWS, MIN_BTC_FLOWS } from './config';
import { MarketData } from './types';
import { extractBtcFlows, generateSyntheticBtcFlows } from './btcFlows';
import { extractEthDefiFlows, extractPlatformFlows, extractMarketCapFlows } from './altcoinFlows';
import { prioritizeAndSortFlows, ensureMinimumBtcFlows } from './flowUtils';

export const fetchMarketData = async (timeframe: string): Promise<FlowData[]> => {
  try {
    // Clear all market data cache to force refresh with new low-cap focus
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('market-data-') || key.startsWith('crypto-') || key.startsWith('flow-')) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('Cache cleared - prioritizing low market cap cryptos for altseason detection');
    
    // Add caching and retry logic
    const cacheKey = `market-data-${timeframe}-${new Date().toISOString().split('T')[0]}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Implement retry logic
    const fetchWithRetry = async (retries = 3): Promise<MarketData[]> => {
      try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&sparkline=false&price_change_percentage=24h,7d,30d`
    );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch market data: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        if (retries > 0) {
          console.log(`Retrying market data fetch, ${retries} attempts remaining`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry(retries - 1);
        }
        throw error;
      }
    };

    const data = await fetchWithRetry();
    const btcData = data.find(coin => coin.symbol === 'btc');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    // Build a lookup map for market data by symbol (uppercase)
    const marketDataMap = new Map<string, MarketData>();
    data.forEach(coin => marketDataMap.set(coin.symbol.toUpperCase(), coin));

    // Calculate flows between different categories
    let flows: FlowData[] = [];
    
    // Extract BTC flows
    const btcFlows = extractBtcFlows(data, btcData);
    flows = [...flows, ...btcFlows];
    
    // Get synthetic BTC flows for later use if needed
    const syntheticBtcFlows = generateSyntheticBtcFlows(data, flows);
    
    // Synthetic random BTC flows removed: only relative-strength flows derived from real market data are shown.

    // Extract additional flows
    const ethDefiFlows = extractEthDefiFlows(data);
    const platformFlows = extractPlatformFlows(data);
    const marketCapFlows = extractMarketCapFlows(data);
    
    // Combine all flows
    flows = [...flows, ...ethDefiFlows, ...platformFlows, ...marketCapFlows];

    // Enrich every flow with market data (volume, marketCap, change) from primary symbol
    flows = flows.map(flow => {
      // Primary symbol = the non-BTC / non-stablecoin side; fallback to 'from'
      const stablecoins = new Set(['USDT','USDC','DAI','BUSD','TUSD','FRAX','USDP','PYUSD']);
      const primarySymbol = (flow.from === 'BTC' || stablecoins.has(flow.from)) ? flow.to : flow.from;
      const md = marketDataMap.get(primarySymbol);
      if (md) {
        return {
          ...flow,
          volume: md.total_volume ?? 0,
          marketCap: md.market_cap ?? 0,
          change: md.price_change_percentage_24h ?? 0,
          price: md.current_price ?? 0,
          name: md.name,
        };
      }
      return flow;
    });
    
    // Prioritize and sort flows
    const sortedFlows = prioritizeAndSortFlows(flows);
    
    // Take the top flows, ensuring we have a mix of BTC and altcoin flows
    const resultFlows = sortedFlows.slice(0, MAX_FLOWS);
    
    // Ensure minimum number of BTC flows
    const finalFlows = ensureMinimumBtcFlows(resultFlows, data, syntheticBtcFlows);
    
    // Cache the results
    sessionStorage.setItem(cacheKey, JSON.stringify(finalFlows));
    
    return finalFlows;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};
