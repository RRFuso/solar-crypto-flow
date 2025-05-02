
import { FlowData } from '@/types/crypto';
import { MarketData } from './types';
import { MIN_BTC_FLOWS, MAX_FLOWS } from './config';

// Prioritize BTC flows and sort by magnitude
export const prioritizeAndSortFlows = (flows: FlowData[]): FlowData[] => {
  return flows.sort((a, b) => {
    // Prioritize BTC flows
    const aHasBtc = a.from === 'BTC' || a.to === 'BTC';
    const bHasBtc = b.from === 'BTC' || b.to === 'BTC';
    
    if (aHasBtc && !bHasBtc) return -1;
    if (!aHasBtc && bHasBtc) return 1;
    
    // Then sort by magnitude
    return b.value - a.value;
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
