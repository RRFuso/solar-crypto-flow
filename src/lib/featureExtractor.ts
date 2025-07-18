import { CryptoData, FlowData } from '@/types/crypto';
import { fetchTechnicalIndicators, fetchOnChainData } from './dataFetcher';

interface NormalizedFeature {
  symbol: string;
  id: string;
  price: number;
  volume: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  aboveMA: boolean;
  priceChange1h: number;
  priceChange24h: number;
  volumeChange24h: number;
  obv: number;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  divergenceBullish: boolean;
  divergenceBearish: boolean;
}

export interface CryptoFeatures extends NormalizedFeature {}

export async function extractFeatures(
  cryptos: CryptoData[], 
  flowData: FlowData[], 
  timeframe: string,
  contractAddresses: Map<string, { address: string; chain: string }>
): Promise<CryptoFeatures[]> {
  const featuresPromises = cryptos.map(async (crypto) => {
    try {
      // Get technical indicators for this crypto
      const indicators = await fetchTechnicalIndicators(crypto.symbol, timeframe);
      
      // Get on-chain data
      const contractInfo = contractAddresses.get(crypto.symbol.toUpperCase());
      let onChainData = {
        exchangeInflow: 0,
        exchangeOutflow: 0,
        fundingRate: 0,
        netFlow: 0,
        balance: '0',
      };

      if (contractInfo) {
        onChainData = await fetchOnChainData(contractInfo);
      } else {
        console.warn(`No contract info found for ${crypto.symbol}. Skipping on-chain data fetch.`);
      }
      
      // Calculate flow-related metrics from flowData
      const relevantFlows = flowData.filter(
        flow => flow.from === crypto.symbol || flow.to === crypto.symbol
      );
      
      const incomingFlows = relevantFlows
        .filter(flow => flow.to === crypto.symbol)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
        
      const outgoingFlows = relevantFlows
        .filter(flow => flow.from === crypto.symbol)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);
      
      // Build the feature object
      const feature: CryptoFeatures = {
        symbol: crypto.symbol,
        id: crypto.id,
        price: crypto.price || 0,
        volume: crypto.volume || 0,
        rsi: indicators.rsi,
        rsi4h: indicators.rsi4h,
        macd: indicators.macd.value,
        macdSignal: indicators.macd.signal,
        macdHistogram: indicators.macd.histogram,
        aboveMA: parseFloat(crypto.price.toString()) > indicators.ema26,
        priceChange1h: crypto.priceChange1h || 0,
        priceChange24h: crypto.priceChange24h || 0,
        volumeChange24h: crypto.volumeChange24h || 0,
        obv: indicators.obv,
        netFlowPercentage: incomingFlows + outgoingFlows > 0 
          ? ((incomingFlows - outgoingFlows) / (incomingFlows + outgoingFlows)) * 100 
          : 0,
        incomingFlows,
        outgoingFlows,
        exchangeInflow: onChainData.exchangeInflow,
        exchangeOutflow: onChainData.exchangeOutflow,
        divergenceBullish: false, // Will be calculated below
        divergenceBearish: false, // Will be calculated below
      };
      
      // Calculate divergences
      feature.divergenceBullish = 
        feature.priceChange1h < 0 &&
        feature.rsi > 50 &&
        feature.obv > 0 &&
        feature.macdHistogram > 0;

      feature.divergenceBearish = 
        feature.priceChange1h > 0 &&
        feature.rsi < 50 &&
        feature.obv < 0 &&
        feature.macdHistogram < 0;
      
      return feature;
    } catch (error) {
      console.error(`Error extracting features for ${crypto.symbol}:`, error);
      // Return a default feature object if there's an error
      return {
        symbol: crypto.symbol,
        id: crypto.id,
        price: crypto.price || 0,
        volume: crypto.volume || 0,
        rsi: 50,
        rsi4h: 50,
        macd: 0,
        macdSignal: 0,
        macdHistogram: 0,
        aboveMA: false,
        priceChange1h: crypto.priceChange1h || 0,
        priceChange24h: crypto.priceChange24h || 0,
        volumeChange24h: crypto.volumeChange24h || 0,
        obv: 0,
        netFlowPercentage: 0,
        incomingFlows: 0,
        outgoingFlows: 0,
        exchangeInflow: 0,
        exchangeOutflow: 0,
        divergenceBullish: false,
        divergenceBearish: false,
      } as CryptoFeatures;
    }
  });
  
  return Promise.all(featuresPromises);
}

export function normalizeFeatures(features: CryptoFeatures[]): NormalizedFeature[] {
  return features.map((feature) => {
    return {
      symbol: feature.symbol,
      id: feature.id,
      price: feature.price,
      volume: feature.volume,
      rsi: feature.rsi,
      rsi4h: feature.rsi4h,
      macd: feature.macd,
      macdSignal: feature.macdSignal,
      macdHistogram: feature.macdHistogram,
      aboveMA: feature.aboveMA,
      priceChange1h: feature.priceChange1h,
      priceChange24h: feature.priceChange24h,
      volumeChange24h: feature.volumeChange24h,
      obv: feature.obv,
      netFlowPercentage: feature.netFlowPercentage,
      incomingFlows: feature.incomingFlows,
      outgoingFlows: feature.outgoingFlows,
      exchangeInflow: feature.exchangeInflow,
      exchangeOutflow: feature.exchangeOutflow,
      divergenceBullish: feature.divergenceBullish,
      divergenceBearish: feature.divergenceBearish,
    };
  });
}
