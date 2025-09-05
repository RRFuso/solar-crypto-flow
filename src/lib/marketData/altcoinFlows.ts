
import { MarketData } from './types';
import { FlowData } from '@/types/crypto';
import { defiTokens, platformTokens, lowCapGems, memeTokens, aiTokens, gamingTokens } from './config';

// Extract ETH vs DeFi coins flows
export const extractEthDefiFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  const ethData = data.find(coin => coin.symbol === 'eth');
  
  if (!ethData) return flows;
  
  const defiCoins = data.filter(coin => defiTokens.includes(coin.symbol));
  
  defiCoins.forEach(coin => {
    if (coin.market_cap_change_percentage_24h) {
      const relativeFlow = coin.market_cap_change_percentage_24h - ethData.market_cap_change_percentage_24h;
      const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / ethData.market_cap / 10;
      
      if (Math.abs(relativeFlow) > 1.5) {
        flows.push({
          id: `eth-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
          from: relativeFlow > 0 ? 'ETH' : coin.symbol.toUpperCase(),
          to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'ETH',
          value: flowMagnitude,
          percentage: relativeFlow
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
        const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        
        if (Math.abs(relativeFlow) > 2) {
          const flowMagnitude = Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow) / 100 / 10;
          
          flows.push({
            id: `${coinA.symbol}-${coinB.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
            from: relativeFlow > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
            value: flowMagnitude,
            percentage: relativeFlow
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

// Extract flows from narrative categories (meme, AI, gaming tokens)
export const extractNarrativeFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  
  // Meme token flows
  const memeCoins = data.filter(coin => memeTokens.includes(coin.symbol));
  if (memeCoins.length > 1) {
    const avgMemeChange = memeCoins.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / memeCoins.length;
    
    memeCoins.forEach(coin => {
      const relativeFlow = (coin.market_cap_change_percentage_24h || 0) - avgMemeChange;
      if (Math.abs(relativeFlow) > 3) {
        flows.push({
          id: `meme-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from: relativeFlow < 0 ? coin.symbol.toUpperCase() : 'MEME',
          to: relativeFlow < 0 ? 'MEME' : coin.symbol.toUpperCase(),
          value: coin.market_cap * Math.abs(relativeFlow) / 1000,
          percentage: relativeFlow
        });
      }
    });
  }

  // AI token flows
  const aiCoins = data.filter(coin => aiTokens.includes(coin.symbol));
  if (aiCoins.length > 1) {
    const avgAiChange = aiCoins.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / aiCoins.length;
    
    aiCoins.forEach(coin => {
      const relativeFlow = (coin.market_cap_change_percentage_24h || 0) - avgAiChange;
      if (Math.abs(relativeFlow) > 2.5) {
        flows.push({
          id: `ai-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from: relativeFlow < 0 ? coin.symbol.toUpperCase() : 'AI',
          to: relativeFlow < 0 ? 'AI' : coin.symbol.toUpperCase(),
          value: coin.market_cap * Math.abs(relativeFlow) / 800,
          percentage: relativeFlow
        });
      }
    });
  }

  // Gaming token flows
  const gamingCoins = data.filter(coin => gamingTokens.includes(coin.symbol));
  if (gamingCoins.length > 1) {
    const avgGamingChange = gamingCoins.reduce((sum, coin) => sum + (coin.market_cap_change_percentage_24h || 0), 0) / gamingCoins.length;
    
    gamingCoins.forEach(coin => {
      const relativeFlow = (coin.market_cap_change_percentage_24h || 0) - avgGamingChange;
      if (Math.abs(relativeFlow) > 2) {
        flows.push({
          id: `gaming-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from: relativeFlow < 0 ? coin.symbol.toUpperCase() : 'GAMING',
          to: relativeFlow < 0 ? 'GAMING' : coin.symbol.toUpperCase(),
          value: coin.market_cap * Math.abs(relativeFlow) / 600,
          percentage: relativeFlow
        });
      }
    });
  }
  
  return flows;
};

// Extract flows for low-cap gems with high potential
export const extractLowCapGemFlows = (data: MarketData[]): FlowData[] => {
  const flows: FlowData[] = [];
  
  const gemCoins = data.filter(coin => lowCapGems.includes(coin.symbol));
  const ethData = data.find(coin => coin.symbol === 'eth');
  
  if (!ethData || gemCoins.length === 0) return flows;
  
  // Create flows between ETH and low cap gems
  gemCoins.forEach(coin => {
    if (coin.market_cap_change_percentage_24h) {
      const relativeFlow = coin.market_cap_change_percentage_24h - ethData.market_cap_change_percentage_24h;
      
      // Lower threshold for gems as they're more volatile
      if (Math.abs(relativeFlow) > 2) {
        const flowMagnitude = coin.market_cap * Math.abs(relativeFlow) / 500;
        
        flows.push({
          id: `gem-${coin.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from: relativeFlow > 0 ? 'ETH' : coin.symbol.toUpperCase(),
          to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'ETH',
          value: flowMagnitude,
          percentage: relativeFlow
        });
      }
    }
  });

  // Create flows between gems themselves
  for (let i = 0; i < gemCoins.length; i++) {
    for (let j = i + 1; j < gemCoins.length && flows.length < 10; j++) {
      const coinA = gemCoins[i];
      const coinB = gemCoins[j];
      
      if (coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
        const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
        
        if (Math.abs(relativeFlow) > 5) {
          const flowMagnitude = Math.min(coinA.market_cap, coinB.market_cap) * Math.abs(relativeFlow) / 1000;
          
          flows.push({
            id: `gem-cross-${coinA.symbol}-${coinB.symbol}-${Date.now()}`,
            from: relativeFlow > 0 ? coinB.symbol.toUpperCase() : coinA.symbol.toUpperCase(),
            to: relativeFlow > 0 ? coinA.symbol.toUpperCase() : coinB.symbol.toUpperCase(),
            value: flowMagnitude,
            percentage: relativeFlow
          });
        }
      }
    }
  }
  
  return flows;
};
