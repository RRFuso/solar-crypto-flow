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
    let value: number | string;
    let reason: string | undefined;

    switch (condition.type) {
      case 'confidence':
        if (!prediction) return { score: 0 };
        value = prediction.confidence;
        reason = `AI confidence: ${(value * 100).toFixed(1)}%`;
        break;

      case 'explosivePotential':
        if (!priceActionSignal) return { score: 0 };
        const potentialMap = { 'High': 0.8, 'Medium': 0.6, 'Low': 0.4, 'None': 0 };
        value = potentialMap[priceActionSignal.explosivePotential];
        reason = `Explosive potential: ${priceActionSignal.explosivePotential}`;
        break;

      case 'recommendation':
        if (!prediction || typeof prediction.recommendation === 'undefined') return { score: 0 };
        value = prediction.recommendation;
        reason = `AI recommendation: ${prediction.recommendation}`;
        break;

      default:
        return { score: 0 };
    }

    // Evaluate condition
    let conditionMet = false;
    
    if (typeof value === 'number' && typeof condition.value === 'number') {
      switch (condition.operator) {
        case 'gt':
          conditionMet = value > condition.value;
          break;
        case 'gte':
          conditionMet = value >= condition.value;
          break;
        case 'lt':
          conditionMet = value < condition.value;
          break;
        case 'lte':
          conditionMet = value <= condition.value;
          break;
        case 'eq':
          conditionMet = value === condition.value;
          break;
      }
    } else if (typeof value === 'string' && typeof condition.value === 'string') {
        conditionMet = value === condition.value;
    }

    if (!conditionMet) return { score: 0 };

    // Return positive score for bullish conditions, negative for bearish
    const score = prediction?.bullish ? 1 : -1;
    return { score, reason };
  }
}


