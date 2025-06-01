
import { CryptoData, FlowData } from '@/types/crypto';
import { fetchTechnicalIndicators, fetchOnChainData } from './dataFetcher';

interface NormalizedFeature {
  symbol: string;
  id: string;
  price: number;
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
  timeframe: string
): Promise<CryptoFeatures[]> {
  const featuresPromises = cryptos.map(async (crypto) => {
    try {
      // Get technical indicators for this crypto
      const indicators = await fetchTechnicalIndicators(crypto.symbol, timeframe);
      
      // Get on-chain data
      const onChainData = await fetchOnChainData(crypto.symbol);
      
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
        price: parseFloat(crypto.price) || 0,
        rsi: indicators.rsi,
        rsi4h: indicators.rsi4h,
        macd: indicators.macd.value,
        macdSignal: indicators.macd.signal,
        macdHistogram: indicators.macd.histogram,
        aboveMA: parseFloat(crypto.price) > indicators.ema26,
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
        price: parseFloat(crypto.price) || 0,
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

export function normalizeFeatures(data: CryptoData[]): NormalizedFeature[] {
  return data.map((item) => {
    const rsi = item.indicators?.rsi ?? 50;
    const rsi4h = item.indicators?.rsi4h ?? 50;
    const macd = item.indicators?.macd ?? 0;
    const macdSignal = item.indicators?.macdSignal ?? 0;
    const macdHistogram = macd - macdSignal;

    const price = item.price ?? 0;
    const priceChange1h = item.priceChange1h ?? 0;
    const priceChange24h = item.priceChange24h ?? 0;
    const volumeChange24h = item.volumeChange24h ?? 0;
    const obv = item.obv ?? 0;

    const aboveMA = (item.indicators?.ma ?? price) < price;

    const incomingFlows = item.incomingFlows ?? 0;
    const outgoingFlows = item.outgoingFlows ?? 0;
    const exchangeInflow = item.exchangeInflow ?? 0;
    const exchangeOutflow = item.exchangeOutflow ?? 0;

    const netFlow = incomingFlows - outgoingFlows;
    const totalFlow = incomingFlows + outgoingFlows || 1;
    const netFlowPercentage = (netFlow / totalFlow) * 100;

    // Detectar divergência bullish (RSI sobe, preço cai, OBV sobe)
    const divergenceBullish = 
      priceChange1h < 0 &&
      rsi > 50 &&
      obv > 0 &&
      macdHistogram > 0;

    // Detectar divergência bearish (RSI cai, preço sobe, OBV negativo)
    const divergenceBearish = 
      priceChange1h > 0 &&
      rsi < 50 &&
      obv < 0 &&
      macdHistogram < 0;

    return {
      symbol: item.symbol,
      id: item.id,
      price,
      rsi,
      rsi4h,
      macd,
      macdSignal,
      macdHistogram,
      aboveMA,
      priceChange1h,
      priceChange24h,
      volumeChange24h,
      obv,
      netFlowPercentage,
      incomingFlows,
      outgoingFlows,
      exchangeInflow,
      exchangeOutflow,
      divergenceBullish,
      divergenceBearish,
    };
  });
}
