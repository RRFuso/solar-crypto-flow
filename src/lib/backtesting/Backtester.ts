/**
 * Framework de Backtesting.
 * Rico em métricas: win rate, profit factor, drawdown, Sharpe, Sortino, expectancy.
 */

export interface HistoricalData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  factors: string[];
}

export interface TradingStrategy {
  generateSignal(history: HistoricalData[]): Promise<Signal | null>;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  entryTime: Date;
  exitTime?: Date;
  quantity: number;
  profit?: number;
  profitPercent?: number;
  status: 'open' | 'closed';
  reason?: string;
}

export interface BacktestConfig {
  initialCapital: number;
  positionSize: number; // % do capital por trade
  maxPositions: number;
  stopLoss: number; // %
  takeProfit: number; // %
  commission: number; // %
  slippage: number; // %
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  avgProfit: number;
  avgLoss: number;
  avgWin: number;
  avgLose: number;
  expectancy: number;
  equityCurve: { date: Date; equity: number }[];
  drawdownCurve: { date: Date; drawdown: number }[];
  trades: Trade[];
  monthlyReturns: Map<string, number>;
  yearlyReturns: Map<string, number>;
}

export class Backtester {
  private config: BacktestConfig;
  private trades: Trade[] = [];
  private openPositions: Trade[] = [];
  private capital: number;
  private equity: number[];
  private equityDates: Date[] = [];

  constructor(config: BacktestConfig) {
    this.config = config;
    this.capital = config.initialCapital;
    this.equity = [config.initialCapital];
  }

  /**
   * Sem look-ahead: no candle i a estratégia vê apenas candles fechados [0..i-1];
   * a ordem é executada na abertura do candle i, e stops usam a mínima/máxima de i.
   */
  async run(data: HistoricalData[], strategy: TradingStrategy): Promise<BacktestResults> {
    for (let i = 50; i < data.length; i++) {
      const current = data[i];
      const history = data.slice(0, i); // só candles já fechados

      const signal = await strategy.generateSignal(history);
      if (signal) this.executeSignal(signal, current);
      this.updateOpenPositions(current);

      this.equity.push(this.calculateEquity(current));
      this.equityDates.push(current.timestamp);
    }
    if (data.length > 0) this.closeAllPositions(data[data.length - 1]);
    return this.calculateResults();
  }

  private updateOpenPositions(data: HistoricalData) {
    const toClose: Trade[] = [];
    for (const position of this.openPositions) {
      if (position.side !== 'buy') continue;
      const stopPrice = position.entryPrice * (1 - this.config.stopLoss / 100);
      const tpPrice = position.entryPrice * (1 + this.config.takeProfit / 100);
      // Conservador: se ambos tocados no mesmo candle, assume stop primeiro.
      if (data.low <= stopPrice) {
        position.exitPrice = Math.min(stopPrice, data.open);
        position.exitTime = data.timestamp;
        position.reason = 'Stop Loss';
        toClose.push(position);
      } else if (data.high >= tpPrice) {
        position.exitPrice = Math.max(tpPrice, data.open);
        position.exitTime = data.timestamp;
        position.reason = 'Take Profit';
        toClose.push(position);
      }
    }
    toClose.forEach((p) => this.closePosition(p));
  }

  private executeSignal(signal: Signal, data: HistoricalData) {
    if (signal.action === 'buy' && signal.confidence > 0.7) {
      if (this.openPositions.length >= this.config.maxPositions) return;
      this.openPosition('buy', data);
    } else if (signal.action === 'sell' && this.openPositions.length > 0) {
      this.closeAllPositions(data, data.open);
    }
  }

  private openPosition(side: 'buy' | 'sell', data: HistoricalData) {
    const positionValue = this.capital * (this.config.positionSize / 100);
    const fill = data.open;
    const quantity = positionValue / fill;
    const slippageAmount = fill * (this.config.slippage / 100);
    const entryPrice = fill + (side === 'buy' ? slippageAmount : -slippageAmount);
    const commission = positionValue * (this.config.commission / 100);
    this.capital -= commission;

    const trade: Trade = {
      id: `trade-${this.trades.length + 1}`,
      symbol: data.symbol,
      side,
      entryPrice,
      entryTime: data.timestamp,
      quantity,
      status: 'open',
    };
    this.openPositions.push(trade);
    this.trades.push(trade);
  }

  private closePosition(trade: Trade) {
    if (trade.exitPrice == null || !trade.exitTime) {
      throw new Error('Posição não tem preço de saída');
    }
    const exitValue = trade.quantity * trade.exitPrice;
    const entryValue = trade.quantity * trade.entryPrice;
    const commission = exitValue * (this.config.commission / 100);
    const profit = exitValue - entryValue - commission;
    trade.profit = profit;
    trade.profitPercent = (profit / entryValue) * 100;
    trade.status = 'closed';
    this.capital += exitValue;
    this.openPositions = this.openPositions.filter((p) => p.id !== trade.id);
  }

  private closeAllPositions(data: HistoricalData, price: number = data.close) {
    for (const position of [...this.openPositions]) {
      position.exitPrice = price;
      position.exitTime = data.timestamp;
      position.reason = position.reason ?? 'End of backtest';
      this.closePosition(position);
    }
  }

  private calculateEquity(data: HistoricalData): number {
    let equity = this.capital;
    for (const position of this.openPositions) {
      equity += position.quantity * data.close;
    }
    return equity;
  }

  private calculateResults(): BacktestResults {
    const closedTrades = this.trades.filter((t) => t.status === 'closed');
    const winningTrades = closedTrades.filter((t) => (t.profit ?? 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.profit ?? 0) < 0);
    const winRate = closedTrades.length ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const totalProfit = winningTrades.reduce((s, t) => s + (t.profit ?? 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((s, t) => s + (t.profit ?? 0), 0));
    const netProfit = totalProfit - totalLoss;
    const profitFactor = totalLoss === 0 ? Infinity : totalProfit / totalLoss;

    const avgProfit = totalProfit / (closedTrades.length || 1);
    const avgLoss = totalLoss / (closedTrades.length || 1);
    const avgWin = totalProfit / (winningTrades.length || 1);
    const avgLose = totalLoss / (losingTrades.length || 1);
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLose;

    const { maxDrawdown, maxDrawdownPercent, drawdownCurve } = this.calculateDrawdown();
    const sharpeRatio = this.calculateSharpeRatio();
    const sortinoRatio = this.calculateSortinoRatio();

    const equityCurve = this.equityDates.map((date, i) => ({
      date,
      equity: this.equity[i + 1] ?? this.equity[i],
    }));

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      sortinoRatio,
      avgProfit,
      avgLoss,
      avgWin,
      avgLose,
      expectancy,
      equityCurve,
      drawdownCurve,
      trades: this.trades,
      monthlyReturns: this.aggregateReturns('month'),
      yearlyReturns: this.aggregateReturns('year'),
    };
  }

  private calculateDrawdown() {
    let maxEquity = this.equity[0];
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    const drawdownCurve: { date: Date; drawdown: number }[] = [];
    for (let i = 0; i < this.equity.length; i++) {
      if (this.equity[i] > maxEquity) maxEquity = this.equity[i];
      const drawdown = maxEquity - this.equity[i];
      const drawdownPercent = maxEquity ? (drawdown / maxEquity) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
      const date = this.equityDates[i - 1] ?? this.equityDates[0] ?? new Date();
      drawdownCurve.push({ date, drawdown: drawdownPercent });
    }
    return { maxDrawdown, maxDrawdownPercent, drawdownCurve };
  }

  private calculateReturns(): number[] {
    const returns: number[] = [];
    for (let i = 1; i < this.equity.length; i++) {
      const prev = this.equity[i - 1] || 1;
      returns.push((this.equity[i] - prev) / prev);
    }
    return returns;
  }

  private calculateSharpeRatio(): number {
    const returns = this.calculateReturns();
    if (returns.length === 0) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    const sharpe = std === 0 ? 0 : avg / std;
    return sharpe * Math.sqrt(252);
  }

  private calculateSortinoRatio(): number {
    const returns = this.calculateReturns();
    if (returns.length === 0) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const negatives = returns.filter((r) => r < 0);
    if (negatives.length === 0) return 0;
    const downsideVariance = negatives.reduce((s, r) => s + r * r, 0) / negatives.length;
    const downsideDev = Math.sqrt(downsideVariance);
    const sortino = downsideDev === 0 ? 0 : avg / downsideDev;
    return sortino * Math.sqrt(252);
  }

  /** Agrega retornos por mês (YYYY-MM) ou ano (YYYY). */
  private aggregateReturns(by: 'month' | 'year'): Map<string, number> {
    const result = new Map<string, number>();
    if (this.equityDates.length === 0) return result;

    const buckets = new Map<string, { start: number; end: number }>();
    for (let i = 0; i < this.equityDates.length; i++) {
      const d = this.equityDates[i];
      const key =
        by === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}`;
      const equityValue = this.equity[i + 1] ?? this.equity[i];
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, { start: equityValue, end: equityValue });
      } else {
        existing.end = equityValue;
      }
    }
    for (const [key, { start, end }] of buckets.entries()) {
      const ret = start ? ((end - start) / start) * 100 : 0;
      result.set(key, ret);
    }
    return result;
  }
}
