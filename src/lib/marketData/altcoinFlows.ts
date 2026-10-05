
import { MarketData } from './types';
import { FlowData } from '@/types/crypto';
import { defiTokens, platformTokens } from './config';

// Extract ETH vs DeFi coins flows
export const extractEthDefiFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  const ethData = data.find(coin => coin.symbol === 'eth');
  
  if (!ethData) return flows;
  
  const defiCoins = data.filter(coin => defiTokens.includes(coin.symbol));
  
  defiCoins.forEach(coin => {
    if (coin.market_cap_change_percentage_24h) {
      const relativeStrength = coin.market_cap_change_percentage_24h - ethData.market_cap_change_percentage_24h;
      const flowMagnitude = (coin.market_cap * Math.abs(relativeStrength)) / ethData.market_cap / 10;
      
      if (Math.abs(relativeStrength) > 1.5) {
        flows.push({
          id: `eth-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
          from: relativeStrength > 0 ? 'ETH' : coin.symbol.toUpperCase(),
          to: relativeStrength > 0 ? coin.symbol.toUpperCase() : 'ETH',
          value: flowMagnitude,
          percentage: relativeStrength
        });
      }
    }
  });
  
  return flows;
};

// Extract flows between smart contract platforms
export const extractPlatformFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  
  const platforms = data.filter(coin => platformTokens.includes(coin.symbol));
  
  // Create cross-flows between platforms
  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      const coinA = platforms[i];
      const coinB = platforms[j];
      
      if (coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
        const relativeStrength = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        
        if (Math.abs(relativeStrength) > 2) {
          const flowMagnitude = Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeStrength) / 100 / 10;
          
          flows.push({
            id: `${coinA.symbol}-${coinB.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
            from: relativeStrength > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
            to: relativeStrength > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
            value: flowMagnitude,
            percentage: relativeStrength
          });
        }
      }
    }
  }
  
  return flows;
};

// Extract flows between market cap categories
export const extractMarketCapFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  const btcData = data.find(coin => coin.symbol === 'btc');
  
  if (!btcData) return flows;
  
  // Add LARGE CAPS category for major transfers
  const largeCapThreshold = data[9].market_cap; // Top 10 threshold
  const largeCaps = data.filter(coin => coin.market_cap >= largeCapThreshold && coin.symbol !== 'btc' && coin.symbol !== 'eth');
  const smallCaps = data.filter(coin => coin.market_cap < largeCapThreshold);
  
  // See if there's a trend between large caps and smaller caps
  const avgLargeCapChange = largeCaps.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / largeCaps.length;
  const avgSmallCapChange = smallCaps.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / smallCaps.length;
  
  const largeCapsVsSmallCaps = avgLargeCapChange - avgSmallCapChange;
  
  if (Math.abs(largeCapsVsSmallCaps) > 1) {
    flows.push({
      id: `large-small-${Date.now()}`, // Add unique ID
      from: largeCapsVsSmallCaps < 0 ? 'LARGE' : 'SMALL',
      to: largeCapsVsSmallCaps < 0 ? 'SMALL' : 'LARGE',
      value: Math.abs(largeCapsVsSmallCaps) * 5,
      percentage: largeCapsVsSmallCaps
    });
    
    // Add a BTC to LARGE flow
    flows.push({
      id: `btc-large-${Date.now()}`, // Add unique ID
      from: 'BTC',
      to: 'LARGE',
      value: Math.abs(btcData.market_cap_change_percentage_24h || 0) * 5,
      percentage: (btcData.market_cap_change_percentage_24h || 0) - avgLargeCapChange
    });
  }
  
  return flows;
};
