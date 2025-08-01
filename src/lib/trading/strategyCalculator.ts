import { CryptoData } from '@/types/crypto';
import { calculateRSI, calculateEMA } from '@/lib/technical';

interface TradingLevels {
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskPercent: number;
  rewardPercent: number;
}

interface VolatilityData {
  atr: number;
  volatility: number;
  support: number;
  resistance: number;
}

export class StrategyCalculator {
  /**
   * Calculate trading levels based on technical analysis
   */
  static calculateTradingLevels(
    symbol: string,
    currentPrice: number,
    direction: 'bullish' | 'bearish',
    cryptoData?: CryptoData,
    timeframe: string = '4h'
  ): TradingLevels {
    const volatilityData = this.getVolatilityData(symbol, currentPrice, cryptoData);
    
    if (direction === 'bullish') {
      return this.calculateBullishLevels(currentPrice, volatilityData, timeframe);
    } else {
      return this.calculateBearishLevels(currentPrice, volatilityData, timeframe);
    }
  }

  /**
   * Get volatility and support/resistance data
   */
  private static getVolatilityData(
    symbol: string,
    currentPrice: number,
    cryptoData?: CryptoData
  ): VolatilityData {
    // Use real crypto data if available
    if (cryptoData) {
      const priceChange24h = parseFloat(cryptoData.priceChangePercent || '0') || 0;
      const high24h = parseFloat(cryptoData.highPrice || String(currentPrice)) || currentPrice;
      const low24h = parseFloat(cryptoData.lowPrice || String(currentPrice)) || currentPrice;
      
      // Calculate ATR approximation from 24h data
      const atr = (high24h - low24h) / currentPrice;
      const volatility = Math.abs(priceChange24h) / 100;
      
      return {
        atr: atr * 100, // Convert to percentage
        volatility: volatility * 100,
        support: low24h,
        resistance: high24h
      };
    }

    // Fallback to symbol-based estimates
    const isVolatileCoin = this.isHighVolatilityCoin(symbol);
    const baseVolatility = isVolatileCoin ? 8 : 4;
    
    return {
      atr: baseVolatility,
      volatility: baseVolatility * 0.8,
      support: currentPrice * 0.95,
      resistance: currentPrice * 1.05
    };
  }

  /**
   * Calculate bullish trading levels
   */
  private static calculateBullishLevels(
    currentPrice: number,
    volatilityData: VolatilityData,
    timeframe: string
  ): TradingLevels {
    const { atr, support, resistance } = volatilityData;
    
    // Adjust levels based on timeframe
    const timeframeMultiplier = this.getTimeframeMultiplier(timeframe);
    const adjustedATR = atr * timeframeMultiplier;
    
    // Calculate stop loss (below support or based on ATR)
    const atrStopLoss = currentPrice * (1 - (adjustedATR * 0.5) / 100);
    const supportStopLoss = support * 0.98;
    const stopLoss = Math.max(atrStopLoss, supportStopLoss);
    
    // Calculate take profit levels
    const resistanceLevel = resistance * 1.02;
    const atrTarget1 = currentPrice * (1 + (adjustedATR * 0.8) / 100);
    const atrTarget2 = currentPrice * (1 + (adjustedATR * 1.5) / 100);
    
    const takeProfit1 = Math.min(atrTarget1, resistanceLevel);
    const takeProfit2 = Math.max(atrTarget2, resistanceLevel * 1.03);
    
    // Calculate risk/reward percentages
    const riskPercent = ((currentPrice - stopLoss) / currentPrice) * 100;
    const rewardPercent = ((takeProfit2 - currentPrice) / currentPrice) * 100;
    
    return {
      entry: currentPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      riskPercent,
      rewardPercent
    };
  }

  /**
   * Calculate bearish trading levels
   */
  private static calculateBearishLevels(
    currentPrice: number,
    volatilityData: VolatilityData,
    timeframe: string
  ): TradingLevels {
    const { atr, support, resistance } = volatilityData;
    
    // Adjust levels based on timeframe
    const timeframeMultiplier = this.getTimeframeMultiplier(timeframe);
    const adjustedATR = atr * timeframeMultiplier;
    
    // Calculate stop loss (above resistance or based on ATR)
    const atrStopLoss = currentPrice * (1 + (adjustedATR * 0.5) / 100);
    const resistanceStopLoss = resistance * 1.02;
    const stopLoss = Math.min(atrStopLoss, resistanceStopLoss);
    
    // Calculate take profit levels
    const supportLevel = support * 0.98;
    const atrTarget1 = currentPrice * (1 - (adjustedATR * 0.8) / 100);
    const atrTarget2 = currentPrice * (1 - (adjustedATR * 1.5) / 100);
    
    const takeProfit1 = Math.max(atrTarget1, supportLevel);
    const takeProfit2 = Math.min(atrTarget2, supportLevel * 0.97);
    
    // Calculate risk/reward percentages
    const riskPercent = ((stopLoss - currentPrice) / currentPrice) * 100;
    const rewardPercent = ((currentPrice - takeProfit2) / currentPrice) * 100;
    
    return {
      entry: currentPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      riskPercent,
      rewardPercent
    };
  }

  /**
   * Get timeframe multiplier for ATR calculations
   */
  private static getTimeframeMultiplier(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 0.5;
      case '4h': return 1.0;
      case '1d': return 2.0;
      case '1w': return 4.0;
      default: return 1.0;
    }
  }

  /**
   * Check if coin is high volatility
   */
  private static isHighVolatilityCoin(symbol: string): boolean {
    const highVolatilityCoins = [
      'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK',
      'MEME', 'WIF', 'BOME', 'SLERF', 'MYRO',
      'SATS', 'ORDI', 'RNDR', 'FET', 'AGIX'
    ];
    
    return highVolatilityCoins.some(coin => 
      symbol.toUpperCase().includes(coin)
    );
  }

  /**
   * Calculate position size based on risk management
   */
  static calculatePositionSize(
    accountBalance: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number,
    maxRiskPerTrade: number = 2
  ): number {
    const riskAmount = accountBalance * (maxRiskPerTrade / 100);
    const priceRisk = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / priceRisk;
    
    return Math.min(positionSize, accountBalance * 0.1); // Max 10% of balance per trade
  }

  /**
   * Validate trading levels
   */
  static validateLevels(levels: TradingLevels, direction: 'bullish' | 'bearish'): boolean {
    if (direction === 'bullish') {
      return levels.stopLoss < levels.entry && 
             levels.entry < levels.takeProfit1 && 
             levels.takeProfit1 < levels.takeProfit2;
    } else {
      return levels.stopLoss > levels.entry && 
             levels.entry > levels.takeProfit1 && 
             levels.takeProfit1 > levels.takeProfit2;
    }
  }
}