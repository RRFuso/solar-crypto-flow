
import { useState, useEffect, useCallback } from 'react';
import { AutoTradeConfig, AutoTradeState, TradingStrategy } from '@/types/autotrade';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { SignalProcessor } from '@/lib/autotrade/signalProcessor';
import { orderExecutor } from '@/lib/autotrade/orderExecutor';
import { exchangeManager } from '@/lib/autotrade/exchanges';
import { toast } from 'sonner';

const DEFAULT_CONFIG: AutoTradeConfig = {
  enabled: false,
  paperTrading: true,
  exchangeId: 'binance',
  strategies: [],
  riskManagement: {
    maxDailyLoss: 5,
    maxWeeklyLoss: 15,
    maxOpenPositions: 3,
    emergencyStopLoss: 20,
    allowedTradingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  }
};

export const useAutoTrade = (flowData?: any) => {
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

        // Execute trades based on signals
        for (const signal of processedSignals) {
          if (signal.confidence < 0.6) continue;

          try {
            if (config.paperTrading) {
              await simulateTrade(signal);
            } else {
              await executeLiveTrade(signal);
            }
          } catch (error) {
            console.error(`Erro ao executar trade para ${signal.symbol}:`, error);
            toast.error(`Erro no trade: ${signal.symbol}`, {
              description: error.message
            });
          }
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

  const simulateTrade = async (signal: any) => {
    // Check if we already have a position for this symbol
    const existingPosition = state.openPositions.find(p => p.symbol === signal.symbol);
    if (existingPosition) return;

    // Simulate opening a position
    const mockPrice = 50000; // Mock price for simulation
    const position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      side: signal.action === 'buy' ? 'long' as const : 'short' as const,
      amount: 0.001,
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
  };

  const executeLiveTrade = async (signal: any) => {
    try {
      const strategy = config.strategies.find(s => s.id === signal.strategyId);
      if (!strategy) return;

      // Calculate position size based on strategy configuration
      const positionAmount = calculatePositionSize(strategy.positionSize, signal);
      
      // Calculate stop loss and take profit prices
      const currentPrice = 50000; // This should come from real market data
      const stopLossPrice = strategy.stopLoss.enabled ? 
        currentPrice * (1 - strategy.stopLoss.value / 100) : undefined;
      const takeProfitPrice = strategy.takeProfit.enabled ? 
        currentPrice * (1 + strategy.takeProfit.targets[0].priceTarget / 100) : undefined;

      const orderParams = {
        exchangeId: config.exchangeId,
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        type: 'market' as const,
        amount: positionAmount,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        strategy: signal.strategyId
      };

      await orderExecutor.executeOrder(orderParams, config);
      
      toast.success(`Live Trade: ${signal.action.toUpperCase()} ${signal.symbol}`, {
        description: `Amount: ${positionAmount} - Confidence: ${(signal.confidence * 100).toFixed(1)}%`
      });
    } catch (error) {
      console.error('Live trade execution error:', error);
      throw error;
    }
  };

  const calculatePositionSize = (positionConfig: any, signal: any): number => {
    switch (positionConfig.type) {
      case 'percentage':
        return positionConfig.value / 100; // Simplified calculation
      case 'fixed':
        return positionConfig.value;
      case 'risk_based':
        return positionConfig.maxRisk / 100; // Simplified risk-based calculation
      default:
        return 0.001; // Default small position
    }
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
        toast.error('Exchange connection required', {
          description: 'Please configure exchange connection for live trading'
        });
        return;
      }

      // Additional validation for live trading
      if (!config.paperTrading) {
        toast.warning('Live trading requires additional verification', {
          description: 'Ensure 2FA is enabled and exchanges are properly configured'
        });
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
