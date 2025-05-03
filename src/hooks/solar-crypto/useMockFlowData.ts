
import { useState, useEffect } from 'react';
import { FlowData } from '@/types/crypto';

interface CryptoMetric {
  id: string;
  name?: string;
  gravityIndex: number;
  netFlow: number;
  color: string;
}

interface MockFlowData {
  flowData: FlowData[];
  isLoading: boolean;
  cryptoMetrics: CryptoMetric[];
}

const generateRandomFlows = (timeframe: string): FlowData[] => {
  // Core crypto assets
  const cryptoAssets = [
    { id: 'BTC', category: 'bitcoin' },
    { id: 'ETH', category: 'ethereum' },
    { id: 'SOL', category: 'solana' },
    { id: 'BNB', category: 'bnb' },
    { id: 'USDT', category: 'stablecoin' },
    { id: 'USDC', category: 'stablecoin' },
    { id: 'ADA', category: 'layer1' },
    { id: 'AVAX', category: 'layer1' },
    { id: 'MATIC', category: 'layer2' },
    { id: 'PEPE', category: 'memecoin' },
    { id: 'LINK', category: 'infrastructure' },
    { id: 'UNI', category: 'defi' },
    { id: 'AAVE', category: 'defi' },
    { id: 'SAND', category: 'metaverse' },
    { id: 'AXS', category: 'gaming' },
  ];
  
  // Generate flows between assets
  const flows: FlowData[] = [];
  
  // Make BTC and ETH more central in the flow network
  const centralAssets = ['BTC', 'ETH', 'USDT', 'SOL'];
  
  // Value multiplier based on timeframe
  const valueMultiplier = timeframe === '7d' ? 10 : 
                         timeframe === '24h' ? 5 :
                         timeframe === '1h' ? 2 : 1;
  
  // Create flows between crypto pairs
  cryptoAssets.forEach(fromAsset => {
    // Each asset can connect to 2-5 other assets
    const numConnections = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numConnections; i++) {
      // Pick a random target asset that's different from source
      const toAssets = cryptoAssets.filter(a => a.id !== fromAsset.id);
      const toAsset = toAssets[Math.floor(Math.random() * toAssets.length)];
      
      // Higher probability to connect to central assets
      if (Math.random() < 0.3 && !centralAssets.includes(fromAsset.id)) {
        const centralAsset = centralAssets[Math.floor(Math.random() * centralAssets.length)];
        const centralTarget = cryptoAssets.find(a => a.id === centralAsset);
        if (centralTarget && centralTarget.id !== fromAsset.id) {
          // Use central asset as target
          const toAsset = centralTarget;
          
          // Generate flow data
          const baseValue = (Math.random() * 20 + 1) * 1000000 * valueMultiplier;
          const percentage = (Math.random() * 30) - 15; // Range: -15% to +15%
          
          flows.push({
            from: fromAsset.id,
            to: toAsset.id,
            value: baseValue,
            percentage: percentage,
            fromCategory: fromAsset.category,
            toCategory: toAsset.category,
            categories: [fromAsset.category, toAsset.category]
          });
        }
      } else {
        // Generate normal flow
        const baseValue = (Math.random() * 20 + 1) * 1000000 * valueMultiplier;
        const percentage = (Math.random() * 30) - 15; // Range: -15% to +15%
        
        flows.push({
          from: fromAsset.id,
          to: toAsset.id,
          value: baseValue,
          percentage: percentage,
          fromCategory: fromAsset.category,
          toCategory: toAsset.category,
          categories: [fromAsset.category, toAsset.category]
        });
      }
    }
  });
  
  // Add some extra stablecoin flows for realism
  const stablecoins = ['USDT', 'USDC'];
  const tradingPairs = ['BTC', 'ETH', 'SOL', 'BNB'];
  
  stablecoins.forEach(stablecoin => {
    tradingPairs.forEach(pair => {
      if (Math.random() > 0.3) {
        const baseValue = (Math.random() * 30 + 5) * 1000000 * valueMultiplier;
        const percentage = (Math.random() * 20) - 10; // Range: -10% to +10%
        
        const stablecoinAsset = cryptoAssets.find(a => a.id === stablecoin);
        const pairAsset = cryptoAssets.find(a => a.id === pair);
        
        if (stablecoinAsset && pairAsset) {
          flows.push({
            from: stablecoin,
            to: pair,
            value: baseValue,
            percentage: percentage,
            fromCategory: stablecoinAsset.category,
            toCategory: pairAsset.category,
            categories: [stablecoinAsset.category, pairAsset.category]
          });
        }
      }
    });
  });
  
  // For every 10th flow, make it an anomaly with higher percentage
  flows.forEach((flow, index) => {
    if (index % 10 === 0) {
      flow.percentage = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 50 + 30); // 30% to 80%
      flow.value = flow.value * 1.5; // Higher value for anomalies
    }
  });
  
  return flows;
};

// Generate Crypto Gravity Index metrics
const generateCryptoMetrics = (flowData: FlowData[]): CryptoMetric[] => {
  const uniqueCryptos = Array.from(new Set([
    ...flowData.map(d => d.from),
    ...flowData.map(d => d.to)
  ]));
  
  return uniqueCryptos.map(id => {
    // Calculate inflows and outflows
    const inflows = flowData
      .filter(flow => flow.to === id)
      .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
      
    const outflows = flowData
      .filter(flow => flow.from === id)
      .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
    
    const netFlow = inflows - outflows;
    
    // Gravity index formula: weighted combination of inflows and total flow
    // Higher inflows and higher total volume results in higher gravity
    const totalFlow = inflows + outflows;
    const inflowRatio = inflows / (totalFlow || 1);
    
    // CGI formula: combination of net flow (weighted) and volume
    const marketCapFactor = id === 'BTC' ? 2.0 : 
                          id === 'ETH' ? 1.5 : 
                          id === 'SOL' ? 1.2 : 1.0;
    
    const gravityIndex = ((netFlow / 1000000) * 0.7 + (totalFlow / 10000000) * 0.3) * marketCapFactor;
    
    return {
      id,
      gravityIndex,
      netFlow,
      // Color based on net flow
      color: netFlow > 0 ? "#4ade80" : "#f43f5e"
    };
  });
};

export const useMockFlowData = (timeframe: string): MockFlowData => {
  const [data, setData] = useState<MockFlowData>({
    flowData: [],
    isLoading: true,
    cryptoMetrics: []
  });
  
  useEffect(() => {
    setData(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API delay
    const timer = setTimeout(() => {
      const flowData = generateRandomFlows(timeframe);
      const cryptoMetrics = generateCryptoMetrics(flowData);
      
      setData({
        flowData,
        cryptoMetrics,
        isLoading: false
      });
    }, 800);
    
    return () => clearTimeout(timer);
  }, [timeframe]);
  
  return data;
};
