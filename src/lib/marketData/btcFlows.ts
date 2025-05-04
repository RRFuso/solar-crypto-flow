
import { MarketData } from './types';
import { FlowData } from '@/types/crypto';
import { BTC_FLOW_THRESHOLD } from './config';

// Extract BTC flows from market data
export const extractBtcFlows = (data: MarketData[], btcData: MarketData): FlowData[] => {
  const flows: FlowData[] = [];
  
  // BTC vs other major coins flows
  data.slice(0, 20).forEach((coin) => {
    if (coin.symbol !== 'btc' && coin.market_cap_change_percentage_24h) {
      const relativeFlow = coin.market_cap_change_percentage_24h - btcData.market_cap_change_percentage_24h;
      const flowMagnitude = (coin.market_cap * Math.abs(relativeFlow)) / btcData.market_cap / 10;
      
      // IMPORTANT: Lower threshold to ensure we get BTC flows
      if (Math.abs(relativeFlow) > BTC_FLOW_THRESHOLD) {
        flows.push({
          from: relativeFlow > 0 ? 'BTC' : coin.symbol.toUpperCase(),
          to: relativeFlow > 0 ? coin.symbol.toUpperCase() : 'BTC',
          value: flowMagnitude,
          percentage: relativeFlow
        });
      }
    }
  });
  
  return flows;
};

// Generate synthetic BTC flows if needed
export const generateSyntheticBtcFlows = (data: MarketData[], existingFlows: FlowData[]): FlowData[] => {
  const syntheticFlows: FlowData[] = [];
  const btcData = data.find(coin => coin.symbol === 'btc');
  
  if (!btcData) return syntheticFlows;
  
  // Predefined synthetic BTC flows
  const syntheticBtcFlows = [
    {
      from: 'BTC',
      to: 'ETH',
      value: 50,
      percentage: 2.5
    },
    {
      from: 'SOL',
      to: 'BTC',
      value: 30,
      percentage: -1.8
    },
    {
      from: 'BTC',
      to: 'AVAX',
      value: 25,
      percentage: 1.5
    },
    {
      from: 'DOT',
      to: 'BTC',
      value: 35,
      percentage: -2.1
    },
    {
      from: 'BTC',
      to: 'MATIC',
      value: 20,
      percentage: 1.2
    }
  ];
  
  return syntheticBtcFlows;
};
