
import { FlowData } from '@/types/crypto';
import { MarketData } from './types';
import { MIN_BTC_FLOWS, MAX_FLOWS } from './config';

// Prioritize flows with altseason potential (low market cap focus)
export const prioritizeAndSortFlows = (flows: FlowData[]): FlowData[] => {
  // Add priority scoring for altseason potential
  const prioritizedFlows = flows.map(flow => {
    let priority = Math.abs(flow.value);
    
    // Boost priority for flows involving smaller market cap tokens
    const fromSymbol = flow.from?.toLowerCase() || '';
    const toSymbol = flow.to?.toLowerCase() || '';
    
    // Simple heuristic: longer symbols often indicate newer/smaller projects
    if (fromSymbol.length > 4 || toSymbol.length > 4) {
      priority *= 1.5; // Boost for potential low-cap altcoins
    }
    
    // Boost flows that are not involving major coins (BTC, ETH, BNB, etc.)
    const majorCoins = ['btc', 'eth', 'bnb', 'xrp', 'ada', 'sol', 'dot', 'avax'];
    const isFromMajor = majorCoins.includes(fromSymbol);
    const isToMajor = majorCoins.includes(toSymbol);
    
    if (!isFromMajor && !isToMajor) {
      priority *= 1.3; // Boost for alt-to-alt flows
    } else if (!isFromMajor || !isToMajor) {
      priority *= 1.1; // Slight boost for flows with one altcoin
    }
    
    return { ...flow, priority };
  });

  return prioritizedFlows.sort((a, b) => {
    // First prioritize BTC flows (still important for market direction)
    const aHasBtc = a.from === 'BTC' || a.to === 'BTC';
    const bHasBtc = b.from === 'BTC' || b.to === 'BTC';
    
    // But reduce BTC flow dominance to make room for altcoin flows
    if (aHasBtc && !bHasBtc) return -0.5; // Reduced priority vs original -1
    if (!aHasBtc && bHasBtc) return 0.5;   // Reduced penalty vs original 1
    
    // Sort by priority (includes altseason potential scoring)
    return (b.priority || Math.abs(b.value)) - (a.priority || Math.abs(a.value));
  });
};

// Ensure minimum number of BTC flows
export const ensureMinimumBtcFlows = (
  flows: FlowData[], 
  data: MarketData[], 
  syntheticFlows: FlowData[]
): FlowData[] => {
  const resultFlows = [...flows];
  
  // Make sure we have at least MIN_BTC_FLOWS BTC flows
  const btcFlowsInResult = resultFlows.filter(flow => flow.from === 'BTC' || flow.to === 'BTC');
  
  if (btcFlowsInResult.length < MIN_BTC_FLOWS) {
    console.log(`Only found ${btcFlowsInResult.length} BTC flows, supplementing with synthetic data`);
    
    for (let i = 0; i < MIN_BTC_FLOWS - btcFlowsInResult.length; i++) {
      if (i < syntheticFlows.length) {
        resultFlows.push(syntheticFlows[i]);
      }
    }
  }
  
  return resultFlows;
};
