import { TradingStrategy, BacktestResult } from '@/types/autotrade';
import { BinanceKline } from '@/types/binance';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { Backtester } from './backtester';

interface OptimizationParams {
  stopLoss: { min: number; max: number; step: number };
  takeProfit: { min: number; max: number; step: number };
}

interface OptimizationResult {
  bestCombination: {
    stopLoss: number;
    takeProfit: number;
    metricValue: number;
    result: BacktestResult;
  };
  allResults: any[];
}

export class StrategyOptimizer {
  static async run(
    baseStrategy: TradingStrategy,
    params: OptimizationParams,
    historicalData: Map<string, KLine[]>,
    aiInsights: Map<string, AIInsight>,
    startDate: Date,
    endDate: Date,
    initialCapital: number,
    metric: 'sharpeRatio' | 'totalReturn' | 'winRate'
  ): Promise<OptimizationResult> {
    const results = [];
    const stopLossValues = this.generateRange(params.stopLoss.min, params.stopLoss.max, params.stopLoss.step);
    const takeProfitValues = this.generateRange(params.takeProfit.min, params.takeProfit.max, params.takeProfit.step);

    for (const sl of stopLossValues) {
      for (const tp of takeProfitValues) {
        const variation = {
          ...baseStrategy,
          stopLoss: { ...baseStrategy.stopLoss, value: sl, enabled: true },
          takeProfit: { ...baseStrategy.takeProfit, targets: [{ percentage: 100, priceTarget: tp }], enabled: true },
        };

        const result = await Backtester.runBacktest(
          variation,
          historicalData,
          aiInsights,
          startDate,
          endDate,
          initialCapital
        );
        
        results.push({
          stopLoss: sl,
          takeProfit: tp,
          metricValue: result.metrics[metric],
          result,
        });
      }
    }

    if (results.length === 0) {
      throw new Error('No results generated during optimization.');
    }

    const bestCombination = results.reduce((best, current) => {
      return current.metricValue > best.metricValue ? current : best;
    });

    return {
      bestCombination,
      allResults: results,
    };
  }

  private static generateRange(min: number, max: number, step: number): number[] {
    const values = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  }
}
