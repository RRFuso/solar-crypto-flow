export interface AutoTradeConfig {
  enabled: boolean;
  paperTrading: boolean;
  exchangeId: string;
  apiKey?: string;
  apiSecret?: string;
  strategies: TradingStrategy[];
  riskManagement: RiskConfig;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  signalType: 'priceAction' | 'aiPrediction' | 'flowAnalysis' | 'combined';
  entryConditions: SignalCondition[];
  exitConditions: SignalCondition[];
  positionSize: PositionSizeConfig;
  stopLoss: StopLossConfig;
  takeProfit: TakeProfitConfig;
  maxPositions: number;
  symbols: string[];
}

export interface SignalCondition {
  type: 'confidence' | 'explosivePotential' | 'rsi' | 'macd' | 'volume';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  weight: number;
}

export interface PositionSizeConfig {
  type: 'fixed' | 'percentage' | 'risk_based';
  value: number; // Amount in USD for fixed, percentage for percentage, risk % for risk_based
  maxRisk: number; // Maximum risk per trade as percentage of portfolio
}

export interface StopLossConfig {
  enabled: boolean;
  type: 'percentage' | 'atr' | 'support_resistance';
  value: number;
}

export interface TakeProfitConfig {
  enabled: boolean;
  targets: TakeProfitTarget[];
}

export interface TakeProfitTarget {
  percentage: number; // Percentage of position to close
  priceTarget: number; // Percentage gain target
}

export interface RiskConfig {
  maxDailyLoss: number; // Percentage
  maxWeeklyLoss: number; // Percentage
  maxOpenPositions: number;
  emergencyStopLoss: number; // Percentage
  allowedTradingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'failed';
  strategyId: string;
  timestamp: number;
  filled?: number;
  remaining?: number;
  cost?: number;
  fee?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
  stopLoss?: number;
  takeProfit?: number;
  strategyId: string;
  openTime: number;
}

export interface BacktestResult {
  strategy: TradingStrategy;
  period: {
    start: number;
    end: number;
  };
  trades: CompletedTrade[];
  metrics: {
    totalTrades: number;
    winRate: number;
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
  };
}

export interface CompletedTrade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercentage: number;
  strategyId: string;
  exitReason: 'take_profit' | 'stop_loss' | 'signal' | 'timeout';
}

export interface ProcessedSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasons: string[];
  timestamp: number;
  strategyId: string;
}

export interface AutoTradeState {
  config: AutoTradeConfig;
  isRunning: boolean;
  openPositions: Position[];
  pendingOrders: TradeOrder[];
  completedTrades: CompletedTrade[];
  performance: {
    totalPnl: number;
    totalPnlPercentage: number;
    dailyPnl: number;
    weeklyPnl: number;
    winRate: number;
    totalTrades: number;
  };
  lastUpdate: number;
}
