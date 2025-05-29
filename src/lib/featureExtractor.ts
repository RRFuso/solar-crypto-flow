
import { CryptoData } from "@/types/crypto";

export interface ExtractedFeatures {
  symbol: string;
  id: string;
  price: number;
  volume: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  obv: number;
  aboveMA: boolean;
  priceChange1h: number;
  priceChange24h: number;
  volumeChange24h: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  netFlowPercentage: number;
  divergenceBullish: boolean;
  divergenceBearish: boolean;
}

export function extractFeatures(data: CryptoData): ExtractedFeatures {
  const price = data.close;
  const price1hAgo = data.history["1h"]?.close || price;
  const price24hAgo = data.history["24h"]?.close || price;

  const volume = data.volume;
  const volume24hAgo = data.history["24h"]?.volume || volume;

  const rsi = data.indicators.rsi;
  const rsi4h = data.indicators.rsi4h;
  const macd = data.indicators.macd;
  const macdSignal = data.indicators.macdSignal;
  const obv = data.indicators.obv;

  const ma50 = data.indicators.ma50;
  const ma200 = data.indicators.ma200;
  const aboveMA = price > ma50 && ma50 > ma200;

  const inflow = data.capitalFlow.in;
  const outflow = data.capitalFlow.out;
  const netFlow = inflow - outflow;
  const netFlowPercentage = inflow > 0 ? (netFlow / inflow) * 100 : 0;

  // 🔍 Divergências entre RSI/OBV e Preço
  const prevRSI = data.history["1h"]?.indicators?.rsi || rsi;
  const prevOBV = data.history["1h"]?.indicators?.obv || obv;
  const prevPrice = data.history["1h"]?.close || price;

  const divergenceBullish =
    rsi > prevRSI && price < prevPrice && obv > prevOBV;
  const divergenceBearish =
    rsi < prevRSI && price > prevPrice && obv < prevOBV;

  return {
    symbol: data.symbol,
    id: data.id,
    price,
    volume,
    rsi,
    rsi4h,
    macd,
    macdSignal,
    macdHistogram: macd - macdSignal,
    obv,
    aboveMA,
    priceChange1h: ((price - price1hAgo) / price1hAgo) * 100,
    priceChange24h: ((price - price24hAgo) / price24hAgo) * 100,
    volumeChange24h: ((volume - volume24hAgo) / volume24hAgo) * 100,
    incomingFlows: inflow,
    outgoingFlows: outflow,
    exchangeInflow: data.capitalFlow.exchangeIn || 0,
    exchangeOutflow: data.capitalFlow.exchangeOut || 0,
    netFlowPercentage,
    divergenceBullish,
    divergenceBearish,
  };
}
