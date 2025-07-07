
import { TradingStrategy, BacktestResult, CompletedTrade } from '@/types/autotrade';
import { BinanceTicker, BinanceKline } from '@/types/binance';
import { AIInsight } from '@/hooks/useAdvancedAI';

export class Backtester {
  static async runBacktest(
    strategy: TradingStrategy,
    historicalData: Map<string, BinanceKline[]>,
    aiInsights: Map<string, AIInsight>,
    startDate: Date,
    endDate: Date,
    initialCapital: number = 10000
  ): Promise<BacktestResult> {
    const trades: CompletedTrade[] = [];
    let currentCapital = initialCapital;
    let openPositions: any[] = [];

    const dates = this.getDateRange(startDate, endDate);

    for (const date of dates) {
      // 1. Process exits first
      const stillOpenPositions = [];
      for (const position of openPositions) {
        const symbolData = historicalData.get(position.symbol);
        const currentDayData = symbolData?.find(d => new Date(d.openTime).toDateString() === date.toDateString());
        
        if (currentDayData) {
          const exitConditionMet = this.checkExitConditions(position, currentDayData, strategy);
          if (exitConditionMet) {
            const trade = this.closePosition(position, parseFloat(currentDayData.close), date.getTime(), exitConditionMet.reason);
            trades.push(trade);
            currentCapital += trade.pnl;
          } else {
            stillOpenPositions.push(position);
          }
        } else {
          stillOpenPositions.push(position);
        }
      }
      openPositions = stillOpenPositions;

      // 2. Process entries
      if (openPositions.length >= (strategy.maxPositions || 1)) {
        continue;
      }

      for (const symbol of strategy.symbols) {
        const symbolData = historicalData.get(symbol);
        if (!symbolData) continue;

        const dayData = symbolData.find(d => new Date(d.openTime).toDateString() === date.toDateString());
        if (!dayData) continue;

        const entrySignal = this.checkEntrySignal(symbol, date, aiInsights, strategy);
        
        if (entrySignal) {
          const position = this.openPosition(
            symbol,
            'long',
            parseFloat(dayData.close),
            date.getTime(),
            strategy,
            currentCapital
          );
          if (position) {
            openPositions.push(position);
          }
        }
      }
    }

    const metrics = this.calculateMetrics(trades, initialCapital);

    return {
      strategy,
      period: {
        start: startDate.getTime(),
        end: endDate.getTime()
      },
      trades,
      metrics
    };
  }

  private static getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  private static checkEntrySignal(
    symbol: string,
    currentDate: Date,
    aiInsights: Map<string, AIInsight>,
    strategy: TradingStrategy
  ): boolean {
    // For now, we only use AI signals. This can be expanded.
    if (strategy.signalType !== 'aiPrediction' && strategy.signalType !== 'combined') {
      return false;
    }

    const insight = aiInsights.get(symbol);
    if (!insight) return false;

    // This is a simplified check. A real scenario would check the insight for the specific date.
    // As a proxy, we'll use the latest insight if it's a strong buy.
    const recommendationCondition = strategy.entryConditions.find(c => c.type === 'recommendation');
    
    if (recommendationCondition) {
      return insight.recommendation === recommendationCondition.value;
    }
    
    // Default to strong_buy if no specific condition is set
    return insight.recommendation === 'strong_buy';
  }

  private static checkExitConditions(
    position: any, 
    dayData: BinanceKline, 
    strategy: TradingStrategy
  ): { exit: boolean; price: number; reason: 'take_profit' | 'stop_loss' } {
    const entryPrice = position.entryPrice;
    const highPrice = parseFloat(dayData.high);
    const lowPrice = parseFloat(dayData.low);

    // Check for Stop Loss
    if (strategy.stopLoss?.enabled) {
      const stopLossPrice = entryPrice * (1 - (strategy.stopLoss.value / 100));
      if (lowPrice <= stopLossPrice) {
        return { exit: true, price: stopLossPrice, reason: 'stop_loss' };
      }
    }

    // Check for Take Profit
    if (strategy.takeProfit?.enabled && strategy.takeProfit.targets.length > 0) {
      // For simplicity, we check the first take profit target.
      // A more complex implementation would handle partial exits.
      const takeProfitPrice = entryPrice * (1 + (strategy.takeProfit.targets[0].priceTarget / 100));
      if (highPrice >= takeProfitPrice) {
        return { exit: true, price: takeProfitPrice, reason: 'take_profit' };
      }
    }

    return { exit: false, price: 0, reason: 'stop_loss' }; // Default, should not be used
  }

  private static openPosition(
    symbol: string,
    side: 'long' | 'short',
    price: number,
    timestamp: number,
    strategy: TradingStrategy,
    currentCapital: number
  ) {
    const positionSize = this.calculatePositionSize(strategy.positionSize, currentCapital, price);
    if (positionSize * price > currentCapital) {
      return null; // Not enough capital
    }
    return {
      symbol,
      side,
      entryPrice: price,
      amount: positionSize,
      entryTime: timestamp,
      strategyId: strategy.id,
    };
  }

  private static closePosition(position: any, exitPrice: number, exitTime: number, reason: 'take_profit' | 'stop_loss' | 'signal' | 'timeout'): CompletedTrade {
    const pnl = (exitPrice - position.entryPrice) * position.amount;
    const pnlPercentage = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: position.symbol,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice,
      amount: position.amount,
      entryTime: position.entryTime,
      exitTime,
      pnl,
      pnlPercentage,
      strategyId: position.strategyId,
      exitReason: reason
    };
  }
  
  private static calculatePositionSize(
    config: any,
    capital: number,
    price: number
  ): number {
    switch (config.type) {
      case 'fixed':
        return config.value / price;
      case 'percentage':
        return (capital * (config.value / 100)) / price;
      case 'risk_based':
        const capitalToRisk = capital * (config.maxRisk / 100);
        return capitalToRisk / price;
      default:
        return 100 / price; // Default $100
    }
  }

  private static calculateMetrics(trades: CompletedTrade[], initialCapital: number) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0
      };
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalReturn = (totalPnl / initialCapital) * 100;
    
    const winRate = (winningTrades.length / trades.length) * 100;
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // More robust drawdown calculation
    let equityCurve = [initialCapital];
    let runningCapital = initialCapital;
    for (const trade of trades) {
      runningCapital += trade.pnl;
      equityCurve.push(runningCapital);
    }

    let peakEquity = initialCapital;
    let maxDrawdown = 0;
    for (const equity of equityCurve) {
      if (equity > peakEquity) {
        peakEquity = equity;
      }
      const drawdown = ((peakEquity - equity) / peakEquity) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return {
      totalTrades: trades.length,
      winRate,
      totalReturn,
      sharpeRatio: totalReturn / (maxDrawdown || 1), // Simplified Sharpe Ratio
      maxDrawdown,
      avgWin,
      avgLoss,
      profitFactor
    };
  }
}
