import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { Prediction } from '@/lib/aiModel';
import { TradingStrategy, SignalCondition, ProcessedSignal } from '@/types/autotrade';

export class SignalProcessor {
  static processSignals(
    priceActionSignals: Map<string, PriceActionSignal>,
    predictions: Prediction[],
    strategies: TradingStrategy[]
  ): ProcessedSignal[] {
    const processedSignals: ProcessedSignal[] = [];

    for (const strategy of strategies) {
      if (!strategy.enabled) continue;

      for (const symbol of strategy.symbols) {
        const signal = this.evaluateSymbolForStrategy(
          symbol,
          strategy,
          priceActionSignals.get(symbol),
          predictions.find(p => p.symbol === symbol)
        );

        if (signal) {
          processedSignals.push(signal);
        }
      }
    }

    return processedSignals;
  }

  private static evaluateSymbolForStrategy(
    symbol: string,
    strategy: TradingStrategy,
    priceActionSignal?: PriceActionSignal,
    prediction?: Prediction
  ): ProcessedSignal | null {
    let buyScore = 0;
    let sellScore = 0;
    const reasons: string[] = [];

    // Evaluate entry conditions
    for (const condition of strategy.entryConditions) {
      const { score, reason } = this.evaluateCondition(
        condition,
        priceActionSignal,
        prediction
      );

      if (score > 0) {
        buyScore += score * condition.weight;
        if (reason) reasons.push(reason);
      } else if (score < 0) {
        sellScore += Math.abs(score) * condition.weight;
        if (reason) reasons.push(reason);
      }
    }

    // Determine action based on scores
    const netScore = buyScore - sellScore;
    const confidence = Math.abs(netScore) / strategy.entryConditions.length;

    if (confidence < 0.3) {
      return null; // Not confident enough
    }

    const action = netScore > 0 ? 'buy' : 'sell';

    return {
      symbol,
      action,
      confidence,
      reasons,
      timestamp: Date.now(),
      strategyId: strategy.id
    };
  }

  private static evaluateCondition(
    condition: SignalCondition,
    priceActionSignal?: PriceActionSignal,
    prediction?: Prediction
  ): { score: number; reason?: string } {
    let evaluatedValue: number | string | undefined;
    let reason: string | undefined;

    switch (condition.type) {
      case 'confidence':
        if (!prediction) return { score: 0 };
        evaluatedValue = prediction.confidence;
        reason = `AI confidence: ${(evaluatedValue * 100).toFixed(1)}%`;
        break;

      case 'explosivePotential':
        if (!priceActionSignal) return { score: 0 };
        const potentialMap = { 'High': 0.8, 'Medium': 0.6, 'Low': 0.4, 'None': 0 };
        evaluatedValue = potentialMap[priceActionSignal.explosivePotential];
        reason = `Explosive potential: ${priceActionSignal.explosivePotential}`;
        break;

      case 'recommendation':
        if (!prediction) return { score: 0 };
        evaluatedValue = prediction.direction; // 'bullish' or 'bearish'
        reason = `AI recommendation: ${prediction.direction}`;
        break;

      // Add other cases for rsi, macd, volume if needed

      default:
        return { score: 0 };
    }

    // Evaluate condition
    let conditionMet = false;
    if (typeof evaluatedValue === 'number' && typeof condition.value === 'number') {
      switch (condition.operator) {
        case 'gt':
          conditionMet = evaluatedValue > condition.value;
          break;
        case 'gte':
          conditionMet = evaluatedValue >= condition.value;
          break;
        case 'lt':
          conditionMet = evaluatedValue < condition.value;
          break;
        case 'lte':
          conditionMet = evaluatedValue <= condition.value;
          break;
        case 'eq':
          conditionMet = evaluatedValue === condition.value;
          break;
      }
    } else if (typeof evaluatedValue === 'string' && typeof condition.value === 'string') {
      // For string comparisons, typically 'eq' is used
      if (condition.operator === 'eq') {
        conditionMet = evaluatedValue === condition.value;
      }
    }

    if (!conditionMet) return { score: 0 };

    // Return positive score for bullish conditions, negative for bearish
    const score = prediction?.direction === 'bullish' ? 1 : -1;
    return { score, reason };
  }
}
