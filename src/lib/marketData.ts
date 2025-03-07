
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
    // Increase per_page to 50 to capture more cryptocurrencies
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h,7d,30d`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data: MarketData[] = await response.json();
    const btcData = data.find(coin => coin.symbol === 'btc');
    const ethData = data.find(coin => coin.symbol === 'eth');
    
    if (!btcData) {
      throw new Error('BTC data not found');
    }

    // Calculate flows between different categories
    const flows: FlowData[] = [];
    
    // BTC vs other major coins flows
    data.slice(0, 20).forEach((coin) => {
      if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
        const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
        const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
        
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

    // ETH vs DeFi coins flows
    const defiCoins = data.filter(coin => {
      const defiTokens = ['uni', 'aave', 'mkr', 'snx', 'comp', 'cake', 'crv', 'sushi'];
      return defiTokens.includes(coin.symbol);
    });

    if (ethData) {
      defiCoins.forEach(coin => {
        if (coin.market_cap_change_percentage_24h) {
          const relativeFlow = coin.market_cap_change_percentage_24h - ethData.market_cap_change_percentage_24h;
          const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / ethData.market_cap / 10;
          
          if (Math.abs(relativeFlow) > 1.5) {
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

    // Create some cross-flows between platforms
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const coinA = platforms[i];
        const coinB = platforms[j];
        
        if (coinA.market_cap_change_percentage_24h && coinB.market_cap_change_percentage_24h) {
          const relativeFlow = coinA.market_cap_change_percentage_24h - coinB.market_cap_change_percentage_24h;
          
          if (Math.abs(relativeFlow) > 2) {
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
        from: largeCapsVsSmallCaps < 0 ? 'LARGE' : 'SMALL',
        to: largeCapsVsSmallCaps < 0 ? 'SMALL' : 'LARGE',
        value: Math.abs(largeCapsVsSmallCaps) * 5,
        percentage: largeCapsVsSmallCaps
      });
    }

    // Sort by flow magnitude and limit to a reasonable number to avoid visual clutter
    return flows.sort((a, b) => b.value - a.value).slice(0, 12);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};
