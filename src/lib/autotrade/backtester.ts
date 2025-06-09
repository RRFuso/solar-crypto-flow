
import { TradingStrategy, BacktestResult, CompletedTrade } from '@/types/autotrade';
import { HistoricalData } from '@/lib/aiModel';

export class Backtester {
  static async runBacktest(
    strategy: TradingStrategy,
    historicalData: Map<string, HistoricalData[]>,
    startDate: Date,
    endDate: Date,
    initialCapital: number = 10000
  ): Promise<BacktestResult> {
    const trades: CompletedTrade[] = [];
    let currentCapital = initialCapital;
    let openPositions: Map<string, any> = new Map();

    // Simulate trading day by day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Process signals for each symbol
      for (const symbol of strategy.symbols) {
        const symbolData = historicalData.get(symbol);
        if (!symbolData) continue;

        const dayData = symbolData.find(d => 
          new Date(d.date).toDateString() === currentDate.toDateString()
        );

        if (!dayData) continue;

        // Simulate signal generation and trading decisions
        const signal = this.simulateSignal(dayData, strategy);
        
        if (signal && signal.action !== 'hold') {
          const trade = this.simulateTrade(
            symbol,
            signal.action,
            dayData.price,
            currentDate.getTime(),
            strategy,
            currentCapital
          );

          if (trade) {
            trades.push(trade);
            currentCapital += trade.pnl;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
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

  private static simulateSignal(
    data: HistoricalData,
    strategy: TradingStrategy
  ): { action: 'buy' | 'sell' | 'hold'; confidence: number } | null {
    // Simplified signal simulation based on price action
    const volatility = Math.abs(data.priceChange24h);
    const volumeRatio = data.volume / (data.volume * 0.8); // Simplified

    if (data.priceChange24h > 3 && volatility > 5 && volumeRatio > 1.5) {
      return { action: 'buy', confidence: 0.7 };
    } else if (data.priceChange24h < -3 && volatility > 5) {
      return { action: 'sell', confidence: 0.6 };
    }

    return { action: 'hold', confidence: 0.3 };
  }

  private static simulateTrade(
    symbol: string,
    action: 'buy' | 'sell',
    price: number,
    timestamp: number,
    strategy: TradingStrategy,
    currentCapital: number
  ): CompletedTrade | null {
    // Simplified trade simulation
    const positionSize = this.calculatePositionSize(strategy.positionSize, currentCapital, price);
    const entryPrice = price;
    
    // Simulate holding for 1-3 days with random exit
    const holdDays = Math.floor(Math.random() * 3) + 1;
    const exitTime = timestamp + (holdDays * 24 * 60 * 60 * 1000);
    
    // Simulate price movement (simplified)
    const priceMovement = (Math.random() - 0.5) * 0.1; // ±5%
    const exitPrice = entryPrice * (1 + priceMovement);
    
    const pnl = (exitPrice - entryPrice) * positionSize;
    const pnlPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;

    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side: action === 'buy' ? 'long' : 'short',
      entryPrice,
      exitPrice,
      amount: positionSize,
      entryTime: timestamp,
      exitTime,
      pnl,
      pnlPercentage,
      strategyId: strategy.id,
      exitReason: Math.random() > 0.7 ? 'take_profit' : 'signal'
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
        return (capital * config.value / 100) / price;
      case 'risk_based':
        return (capital * config.maxRisk / 100) / price;
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

    // Simplified drawdown calculation
    let runningPnl = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const trade of trades) {
      runningPnl += trade.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const drawdown = ((peak - runningPnl) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return {
      totalTrades: trades.length,
      winRate,
      totalReturn,
      sharpeRatio: totalReturn / Math.sqrt(trades.length), // Simplified
      maxDrawdown,
      avgWin,
      avgLoss,
      profitFactor
    };
  }
}
