
import { CryptoData, FlowData } from '@/types/crypto';
import { fetchTickers, fetchKlines } from '@/lib/binance';
import { calculateRSI, calculateEMA, calculateMACD, calculateBollingerBands, calculateADX } from '@/lib/technicalAnalysis';

export interface MarketDataPoint {
  symbol: string;
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
  // Technical indicators
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema9: number;
  ema21: number;
  ema50: number;
  bollingerBands: { upper: number; middle: number; lower: number; width: number };
  adx: number;
  // Price action features
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volatility24h: number;
  // Volume features
  volumeChange24h: number;
  volumeEMA: number;
  volumeSpike: boolean;
}

export interface OnChainMetrics {
  symbol: string;
  timestamp: number;
  activeAddresses: number;
  transactionVolume: number;
  networkGrowth: number;
  concentrationByLargeHolders: number;
  exchangeInflowOutflowRatio: number;
  averageCoinAge: number;
}

export interface SocialMetrics {
  symbol: string;
  timestamp: number;
  googleTrendsScore: number;
  twitterMentions: number;
  redditMentions: number;
  sentimentScore: number; // -1 to 1
  influencerScore: number;
  fearGreedIndex: number;
}

export class DataAggregator {
  private marketDataCache: Map<string, MarketDataPoint[]> = new Map();
  private onChainCache: Map<string, OnChainMetrics[]> = new Map();
  private socialCache: Map<string, SocialMetrics[]> = new Map();

  async aggregateMarketData(symbols: string[], timeframe: string = '4h'): Promise<Map<string, MarketDataPoint[]>> {
    const results = new Map<string, MarketDataPoint[]>();
    
    for (const symbol of symbols) {
      try {
        // Get price data
        const klines = await fetchKlines(`${symbol}USDT`, timeframe);
        if (!klines || klines.length === 0) continue;

        const prices = klines.map(k => parseFloat(k.close));
        const volumes = klines.map(k => parseFloat(k.volume));
        const highs = klines.map(k => parseFloat(k.high));
        const lows = klines.map(k => parseFloat(k.low));

        // Calculate technical indicators
        const rsiValues = calculateRSI(prices);
        const macdData = calculateMACD(prices);
        const ema9 = calculateEMA(prices, 9);
        const ema21 = calculateEMA(prices, 21);
        const ema50 = calculateEMA(prices, 50);
        const volumeEMA = calculateEMA(volumes, 20);
        
        const dataPoints: MarketDataPoint[] = [];
        
        for (let i = Math.max(0, klines.length - 100); i < klines.length; i++) {
          const kline = klines[i];
          const currentPrice = parseFloat(kline.close);
          const currentVolume = parseFloat(kline.volume);
          
          // Calculate volatility (24h price range / price)
          const volatility24h = (parseFloat(kline.high) - parseFloat(kline.low)) / currentPrice;
          
          // Calculate price changes
          const priceChange24h = i > 0 ? ((currentPrice - parseFloat(klines[Math.max(0, i - 6)].close)) / parseFloat(klines[Math.max(0, i - 6)].close)) * 100 : 0;
          const priceChange1h = i > 0 ? ((currentPrice - parseFloat(klines[i - 1].close)) / parseFloat(klines[i - 1].close)) * 100 : 0;
          
          // Calculate volume features
          const avgVolume = volumeEMA[Math.min(i, volumeEMA.length - 1)] || currentVolume;
          const volumeChange24h = i > 5 ? ((currentVolume - parseFloat(klines[i - 6].volume)) / parseFloat(klines[i - 6].volume)) * 100 : 0;
          const volumeSpike = currentVolume > avgVolume * 1.5;

          // Calculate Bollinger Bands
          const bollingerBands = calculateBollingerBands(prices.slice(0, i + 1));
          
          // Calculate ADX
          const adx = calculateADX(
            highs.slice(0, i + 1),
            lows.slice(0, i + 1),
            prices.slice(0, i + 1)
          );

          dataPoints.push({
            symbol,
            timestamp: parseInt(kline.openTime),
            price: currentPrice,
            volume: currentVolume,
            marketCap: 0, // Will be filled from ticker data
            rsi: rsiValues[Math.min(i, rsiValues.length - 1)] || 50,
            macd: {
              value: macdData.macd[Math.min(i, macdData.macd.length - 1)] || 0,
              signal: macdData.signal[Math.min(i, macdData.signal.length - 1)] || 0,
              histogram: macdData.histogram[Math.min(i, macdData.histogram.length - 1)] || 0
            },
            ema9: ema9[Math.min(i, ema9.length - 1)] || currentPrice,
            ema21: ema21[Math.min(i, ema21.length - 1)] || currentPrice,
            ema50: ema50[Math.min(i, ema50.length - 1)] || currentPrice,
            bollingerBands,
            adx,
            priceChange1h,
            priceChange24h,
            priceChange7d: 0, // Would need 7d data
            volatility24h,
            volumeChange24h,
            volumeEMA: avgVolume,
            volumeSpike
          });
        }

        results.set(symbol, dataPoints);
        this.marketDataCache.set(symbol, dataPoints);
      } catch (error) {
        console.error(`Error aggregating data for ${symbol}:`, error);
      }
    }

    return results;
  }

  async generateOnChainMetrics(symbols: string[]): Promise<Map<string, OnChainMetrics[]>> {
    // Placeholder for on-chain data integration
    // In production, this would connect to APIs like Glassnode, IntoTheBlock, etc.
    const results = new Map<string, OnChainMetrics[]>();
    
    for (const symbol of symbols) {
      const mockMetrics: OnChainMetrics[] = [{
        symbol,
        timestamp: Date.now(),
        activeAddresses: Math.floor(Math.random() * 100000) + 50000,
        transactionVolume: Math.floor(Math.random() * 1000000) + 500000,
        networkGrowth: (Math.random() - 0.5) * 10, // -5% to +5%
        concentrationByLargeHolders: Math.random() * 100,
        exchangeInflowOutflowRatio: Math.random() * 2,
        averageCoinAge: Math.floor(Math.random() * 365) + 30
      }];
      
      results.set(symbol, mockMetrics);
      this.onChainCache.set(symbol, mockMetrics);
    }

    return results;
  }

  async generateSocialMetrics(symbols: string[]): Promise<Map<string, SocialMetrics[]>> {
    // Placeholder for social data integration
    // In production, this would connect to APIs like Google Trends, Twitter API, Reddit API, etc.
    const results = new Map<string, SocialMetrics[]>();
    
    for (const symbol of symbols) {
      const mockMetrics: SocialMetrics[] = [{
        symbol,
        timestamp: Date.now(),
        googleTrendsScore: Math.floor(Math.random() * 100),
        twitterMentions: Math.floor(Math.random() * 10000),
        redditMentions: Math.floor(Math.random() * 1000),
        sentimentScore: (Math.random() - 0.5) * 2, // -1 to 1
        influencerScore: Math.random() * 100,
        fearGreedIndex: Math.floor(Math.random() * 100)
      }];
      
      results.set(symbol, mockMetrics);
      this.socialCache.set(symbol, mockMetrics);
    }

    return results;
  }

  getMarketDataHistory(symbol: string): MarketDataPoint[] {
    return this.marketDataCache.get(symbol) || [];
  }

  getOnChainHistory(symbol: string): OnChainMetrics[] {
    return this.onChainCache.get(symbol) || [];
  }

  getSocialHistory(symbol: string): SocialMetrics[] {
    return this.socialCache.get(symbol) || [];
  }
}

export const dataAggregator = new DataAggregator();
