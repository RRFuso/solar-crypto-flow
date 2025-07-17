
import { useState, useEffect, useCallback } from 'react';
import { AutoTradeConfig, AutoTradeState, TradingStrategy, ProcessedSignal } from '@/types/autotrade';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { SignalProcessor } from '@/lib/autotrade/signalProcessor';
import { toast } from 'sonner';

const DEFAULT_CONFIG: AutoTradeConfig = {
  enabled: false,
  paperTrading: true,
  exchangeId: 'binance',
  strategies: [
    {
      id: 'ai-strong-buy',
      name: 'AI Strong Buy',
      description: 'Enters a position when the AI signal is "strong_buy".',
      enabled: true,
      signalType: 'aiPrediction',
      symbols: ['BTC', 'ETH', 'SOL'],
      entryConditions: [
        {
          type: 'recommendation',
          value: 'strong_buy',
          operator: 'eq',
          weight: 1,
        },
      ],
      exitConditions: [],
      positionSize: {
        type: 'percentage',
        value: 5, // 5% of capital per trade
        maxRisk: 2,
      },
      stopLoss: {
        enabled: true,
        type: 'percentage',
        value: 3, // 3% stop loss
      },
      takeProfit: {
        enabled: true,
        targets: [{ percentage: 100, priceTarget: 8 }], // 8% take profit
      },
      maxPositions: 3,
    },
  ],
  riskManagement: {
    maxDailyLoss: 5,
    maxWeeklyLoss: 15,
    maxOpenPositions: 3,
    emergencyStopLoss: 20,
    allowedTradingHours: {
      start: '00:00',
      end: '23:59',
      timezone: 'UTC',
    },
  },
};

export const useAutoTrade = (flowData?: FlowData[]) => {
  const [config, setConfig] = useState<AutoTradeConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<AutoTradeState>({
    config: DEFAULT_CONFIG,
    isRunning: false,
    openPositions: [],
    pendingOrders: [],
    completedTrades: [],
    performance: {
      totalPnl: 0,
      totalPnlPercentage: 0,
      dailyPnl: 0,
      weeklyPnl: 0,
      winRate: 0,
      totalTrades: 0
    },
    lastUpdate: Date.now()
  });

  // Get all symbols from active strategies
  const allSymbols = config.strategies.flatMap(s => s.symbols);
  const { signals } = usePriceActionSignals(allSymbols);
  const { predictions } = usePredictions(flowData, 'all', '4h');

  // Process signals and execute trades
  useEffect(() => {
    if (!config.enabled || !state.isRunning) return;

    const processSignals = async () => {
      try {
        const processedSignals = SignalProcessor.processSignals(
          signals,
          predictions,
          config.strategies
        );

        // In paper trading mode, simulate the trades
        if (config.paperTrading) {
          await simulateTrades(processedSignals);
        } else {
          // In live trading mode, execute real trades
          await executeLiveTrades(processedSignals);
        }

        setState(prev => ({
          ...prev,
          lastUpdate: Date.now()
        }));

      } catch (error) {
        console.error('Error processing autotrade signals:', error);
        toast.error('AutoTrade processing error', {
          description: 'Failed to process trading signals'
        });
      }
    };

    // Process signals every 30 seconds
    const interval = setInterval(processSignals, 30000);
    
    // Process immediately
    processSignals();

    return () => clearInterval(interval);
  }, [config, signals, predictions, state.isRunning]);

  const simulateTrades = async (signals: ProcessedSignal[]) => {
    // Simulate paper trading logic
    for (const signal of signals) {
      if (signal.confidence < 0.6) continue;

      // Check if we already have a position for this symbol
      const existingPosition = state.openPositions.find(p => p.symbol === signal.symbol);
      if (existingPosition) continue;

      // Simulate opening a position
      const mockPrice = 50000; // Mock price for simulation
      const position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: signal.symbol,
        side: signal.action === 'buy' ? 'long' as const : 'short' as const,
        amount: 0.001, // Mock amount
        entryPrice: mockPrice,
        currentPrice: mockPrice,
        unrealizedPnl: 0,
        unrealizedPnlPercentage: 0,
        strategyId: signal.strategyId,
        openTime: Date.now()
      };

      setState(prev => ({
        ...prev,
        openPositions: [...prev.openPositions, position]
      }));

      toast.success(`Paper Trade: ${signal.action.toUpperCase()} ${signal.symbol}`, {
        description: `Confidence: ${(signal.confidence * 100).toFixed(1)}% - ${signal.reasons.join(', ')}`
      });
    }
  };

  const executeLiveTrades = async (signals: ProcessedSignal[]) => {
    // This would contain real exchange API calls
    console.log('Live trading not implemented yet:', signals);
    toast.warning('Live trading not available', {
      description: 'Live trading functionality will be implemented in a future update'
    });
  };

  const toggleAutoTrade = useCallback(() => {
    if (!config.enabled) {
      // Validate configuration before enabling
      if (config.strategies.length === 0) {
        toast.error('No strategies configured', {
          description: 'Please add at least one trading strategy'
        });
        return;
      }

      if (!config.paperTrading && (!config.apiKey || !config.apiSecret)) {
        toast.error('API credentials required', {
          description: 'Please configure exchange API credentials for live trading'
        });
        return;
      }
    }

    const newEnabled = !config.enabled;
    setConfig(prev => ({ ...prev, enabled: newEnabled }));
    setState(prev => ({ ...prev, isRunning: newEnabled }));

    toast.success(
      newEnabled ? 'AutoTrade enabled' : 'AutoTrade disabled',
      {
        description: config.paperTrading ? 'Paper trading mode' : 'Live trading mode'
      }
    );
  }, [config]);

  const addStrategy = useCallback((strategy: TradingStrategy) => {
    setConfig(prev => ({
      ...prev,
      strategies: [...prev.strategies, strategy]
    }));
    toast.success('Strategy added', {
      description: `${strategy.name} has been added to your trading strategies`
    });
  }, []);

  const updateStrategy = useCallback((strategyId: string, updates: Partial<TradingStrategy>) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => 
        s.id === strategyId ? { ...s, ...updates } : s
      )
    }));
  }, []);

  const removeStrategy = useCallback((strategyId: string) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.filter(s => s.id !== strategyId)
    }));
    toast.success('Strategy removed');
  }, []);

  const closePosition = useCallback((positionId: string) => {
    setState(prev => ({
      ...prev,
      openPositions: prev.openPositions.filter(p => p.id !== positionId)
    }));
    toast.success('Position closed');
  }, []);

  return {
    config,
    state,
    isEnabled: config.enabled,
    isRunning: state.isRunning,
    activeStrategies: config.strategies.filter(s => s.enabled),
    openPositions: state.openPositions,
    pendingOrders: state.pendingOrders,
    performance: state.performance,
    toggleAutoTrade,
    addStrategy,
    updateStrategy,
    removeStrategy,
    closePosition,
    setConfig
  };
};
