
import { FlowData } from '@/types/crypto';
import { COINGECKO_API, MAX_FLOWS, MIN_BTC_FLOWS } from './config';
import { MarketData } from './types';
import { extractBtcFlows, generateSyntheticBtcFlows } from './btcFlows';
import { extractEthDefiFlows, extractPlatformFlows, extractMarketCapFlows } from './altcoinFlows';
import { prioritizeAndSortFlows, ensureMinimumBtcFlows } from './flowUtils';

export const fetchMarketData = async (timeframe: string): Promise<FlowData[]> => {
  try {
    // Increase per_page to 50 to capture more cryptocurrencies
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
    let flows: FlowData[] = [];
    
    // Extract BTC flows
    const btcFlows = extractBtcFlows(data, btcData);
    flows = [...flows, ...btcFlows];
    
    // Get synthetic BTC flows for later use if needed
    const syntheticBtcFlows = generateSyntheticBtcFlows(data, flows);
    
    // Ensure we have at least some BTC flows
    const existingBtcFlows = flows.filter(flow => flow.from === 'BTC' || flow.to === 'BTC');
    if (existingBtcFlows.length < MIN_BTC_FLOWS && data.length > 5) {
      // Generate some synthetic BTC flows if we don't have enough
      const topCoins = data.slice(1, 8);  // Top coins excluding BTC
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

    // Extract additional flows
    const ethDefiFlows = extractEthDefiFlows(data);
    const platformFlows = extractPlatformFlows(data);
    const marketCapFlows = extractMarketCapFlows(data);
    
    // Combine all flows
    flows = [...flows, ...ethDefiFlows, ...platformFlows, ...marketCapFlows];
    
    // Prioritize and sort flows
    const sortedFlows = prioritizeAndSortFlows(flows);
    
    // Take the top flows, ensuring we have a mix of BTC and altcoin flows
    const resultFlows = sortedFlows.slice(0, MAX_FLOWS);
    
    // Ensure minimum number of BTC flows
    const finalFlows = ensureMinimumBtcFlows(resultFlows, data, syntheticBtcFlows);
    
    return finalFlows;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};
