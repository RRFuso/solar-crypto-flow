
export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  averageProfit: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  dailyReturns: { date: string; return: number }[];
  cumulativeReturns: { date: string; return: number }[];
  monthlyPerformance: { month: string; return: number }[];
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  entryTime: number;
  exitTime?: number;
  profit?: number;
  status: 'open' | 'closed';
  strategy: string;
}

export class PerformanceAnalytics {
  calculatePerformanceMetrics(trades: TradeRecord[], timeframe: string = '30d'): PerformanceMetrics {
    const startDate = this.getStartDateFromTimeframe(timeframe);
    const filteredTrades = trades.filter(trade => 
      trade.exitTime && trade.exitTime >= startDate.getTime()
    );
    
    const completedTrades = filteredTrades.filter(trade => trade.status === 'closed' && trade.profit !== undefined);
    const winningTrades = completedTrades.filter(trade => (trade.profit || 0) > 0);
    const losingTrades = completedTrades.filter(trade => (trade.profit || 0) <= 0);
    
    const totalProfit = winningTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0));
    
    const dailyReturns = this.calculateDailyReturns(completedTrades);
    const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
    
    const riskFreeRate = 0.02 / 365;
    const returns = dailyReturns.map(d => d.return);
    const sharpeRatio = this.calculateSharpeRatio(returns, riskFreeRate);
    const sortinoRatio = this.calculateSortinoRatio(returns, riskFreeRate);
    
    return {
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      averageProfit: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => t.profit || 0))) : 0,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      dailyReturns,
      cumulativeReturns: this.calculateCumulativeReturns(dailyReturns),
      monthlyPerformance: this.calculateMonthlyPerformance(dailyReturns)
    };
  }
  
  private getStartDateFromTimeframe(timeframe: string): Date {
    const now = new Date();
    const match = timeframe.match(/^(\d+)([dmy])$/);
    
    if (!match) {
      throw new Error(`Formato de timeframe inválido: ${timeframe}`);
    }
    
    const [, amount, unit] = match;
    const numAmount = parseInt(amount, 10);
    
    switch (unit) {
      case 'd':
        now.setDate(now.getDate() - numAmount);
        break;
      case 'm':
        now.setMonth(now.getMonth() - numAmount);
        break;
      case 'y':
        now.setFullYear(now.getFullYear() - numAmount);
        break;
    }
    
    return now;
  }
  
  private calculateDailyReturns(trades: TradeRecord[]): { date: string; return: number }[] {
    const dailyReturns: Map<string, number> = new Map();
    
    trades.forEach(trade => {
      if (trade.exitTime && trade.profit !== undefined) {
        const date = new Date(trade.exitTime).toDateString();
        const currentReturn = dailyReturns.get(date) || 0;
        dailyReturns.set(date, currentReturn + trade.profit);
      }
    });
    
    return Array.from(dailyReturns.entries())
      .map(([date, returnValue]) => ({ date, return: returnValue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  private calculateCumulativeReturns(dailyReturns: { date: string; return: number }[]): { date: string; return: number }[] {
    let cumulative = 0;
    return dailyReturns.map(({ date, return: dailyReturn }) => {
      cumulative += dailyReturn;
      return { date, return: cumulative };
    });
  }
  
  private calculateMonthlyPerformance(dailyReturns: { date: string; return: number }[]): { month: string; return: number }[] {
    const monthlyReturns: Map<string, number> = new Map();
    
    dailyReturns.forEach(({ date, return: returnValue }) => {
      const month = new Date(date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      const currentReturn = monthlyReturns.get(month) || 0;
      monthlyReturns.set(month, currentReturn + returnValue);
    });
    
    return Array.from(monthlyReturns.entries())
      .map(([month, returnValue]) => ({ month, return: returnValue }));
  }
  
  private calculateMaxDrawdown(dailyReturns: { date: string; return: number }[]): number {
    let runningTotal = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const { return: returnValue } of dailyReturns) {
      runningTotal += returnValue;
      if (runningTotal > peak) peak = runningTotal;
      const drawdown = ((peak - runningTotal) / Math.max(peak, 1)) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return maxDrawdown;
  }
  
  private calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0;
    
    const excessReturns = returns.map(r => r - riskFreeRate);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcessReturn, 2), 0) / excessReturns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : avgExcessReturn / stdDev;
  }
  
  private calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0;
    
    const excessReturns = returns.map(r => r - riskFreeRate);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    
    const negativeReturns = excessReturns.filter(r => r < 0);
    if (negativeReturns.length === 0) return avgExcessReturn > 0 ? Infinity : 0;
    
    const downwardDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    );
    
    return downwardDeviation === 0 ? 0 : avgExcessReturn / downwardDeviation;
  }
}

export const performanceAnalytics = new PerformanceAnalytics();
