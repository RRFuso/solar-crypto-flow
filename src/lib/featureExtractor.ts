
import { CryptoData, FlowData } from "@/types/crypto";
import { fetchTechnicalIndicators, fetchOnChainData } from "./dataFetcher";

export interface CryptoFeatures {
  symbol: string;
  id: string;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volume: number;
  volumeChange24h: number;
  marketCap: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema12: number;
  ema26: number;
  aboveMA: boolean;
  obv: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  netFlow: number;
  fundingRate: number;
  incomingFlows: number;
  outgoingFlows: number;
  netFlowPercentage: number;
  category: string;
  price: string;
}

/**
 * Extracts feature vectors from raw crypto data and flow data
 */
export async function extractFeatures(
  cryptoData: CryptoData[],
  flowData: FlowData[],
  chartTimeframe: string = '4h'
): Promise<CryptoFeatures[]> {
  const features: CryptoFeatures[] = [];
  
  // Process each crypto
  for (const crypto of cryptoData) {
    try {
      // Get technical indicators and on-chain data
      const technical = await fetchTechnicalIndicators(crypto.symbol, chartTimeframe);
      const onChain = await fetchOnChainData(crypto.symbol);
      
      // Calculate flow metrics
      const incomingFlows = flowData
        .filter(flow => flow.to === crypto.symbol && flow.value > 0)
        .reduce((sum, flow) => sum + flow.value, 0);
        
      const outgoingFlows = flowData
        .filter(flow => flow.from === crypto.symbol && flow.value < 0)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
        
      const netFlowPercentage = crypto.marketCap > 0 
        ? ((incomingFlows - outgoingFlows) / crypto.marketCap) * 100
        : 0;
      
      // Create feature vector
      features.push({
        symbol: crypto.symbol || "",
        id: crypto.id,
        priceChange1h: crypto.priceChange1h || 0,
        priceChange24h: crypto.priceChange24h || 0,
        priceChange7d: crypto.priceChange7d || 0,
        volume: parseFloat(crypto.volume || "0"),
        volumeChange24h: crypto.volumeChange24h || 0,
        marketCap: crypto.marketCap || 0,
        rsi: technical.rsi,
        rsi4h: technical.rsi4h,
        macd: technical.macd.value,
        macdSignal: technical.macd.signal,
        macdHistogram: technical.macd.histogram,
        ema12: technical.ema12,
        ema26: technical.ema26,
        aboveMA: technical.ema12 > technical.ema26,
        obv: technical.obv,
        exchangeInflow: onChain.exchangeInflow,
        exchangeOutflow: onChain.exchangeOutflow,
        netFlow: onChain.netFlow,
        fundingRate: onChain.fundingRate,
        incomingFlows,
        outgoingFlows,
        netFlowPercentage,
        category: crypto.category || 'other',
        price: crypto.price || "0"
      });
    } catch (error) {
      console.error(`Error extracting features for ${crypto.symbol}:`, error);
    }
  }
  
  return features;
}

/**
 * Normalizes feature values to a specified range
 */
export function normalizeFeatures(
  features: CryptoFeatures[],
  minVal: number = -1,
  maxVal: number = 1
): CryptoFeatures[] {
  if (features.length === 0) return [];
  
  // Get min/max values for each numeric feature
  const numericFields = [
    'priceChange1h', 'priceChange24h', 'priceChange7d',
    'volume', 'volumeChange24h', 'marketCap',
    'rsi', 'rsi4h', 'macd', 'macdSignal', 'macdHistogram',
    'ema12', 'ema26', 'obv',
    'exchangeInflow', 'exchangeOutflow', 'netFlow', 'fundingRate',
    'incomingFlows', 'outgoingFlows', 'netFlowPercentage'
  ] as const; // Make this a readonly tuple
  
  // Define an explicit type for numeric fields
  type NumericField = typeof numericFields[number];
  
  const mins: Record<NumericField, number> = {} as Record<NumericField, number>;
  const maxs: Record<NumericField, number> = {} as Record<NumericField, number>;
  
  // Initialize with first feature
  numericFields.forEach(field => {
    mins[field] = features[0][field] as number;
    maxs[field] = features[0][field] as number;
  });
  
  // Find min/max
  features.forEach(feature => {
    numericFields.forEach(field => {
      const val = feature[field] as number;
      if (val < mins[field]) mins[field] = val;
      if (val > maxs[field]) maxs[field] = val;
    });
  });
  
  // Normalize each feature
  return features.map(feature => {
    const normalized = { ...feature } as CryptoFeatures;
    
    numericFields.forEach(field => {
      const val = feature[field] as number;
      const min = mins[field];
      const max = maxs[field];
      
      if (max === min) {
        // Using a type assertion to tell TypeScript this is valid
        (normalized[field] as number) = 0;
      } else {
        const normalizedValue = minVal + ((val - min) / (max - min)) * (maxVal - minVal);
        // Using a type assertion to tell TypeScript this is valid
        (normalized[field] as number) = normalizedValue;
      }
    });
    
    return normalized;
  });
}
