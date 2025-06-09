
import { TradingStrategy } from '@/types/autotrade';

export const strategyTemplates: Record<string, Omit<TradingStrategy, 'id'>> = {
  macdMomentum: {
    name: 'MACD Momentum',
    description: 'Estratégia baseada em crossovers de MACD para capturar movimentos de momentum',
    enabled: true,
    signalType: 'priceAction',
    entryConditions: [
      {
        type: 'rsi',
        operator: 'gt',
        value: 50,
        weight: 0.3
      },
      {
        type: 'volume',
        operator: 'gt',
        value: 1.5,
        weight: 0.4
      }
    ],
    exitConditions: [
      {
        type: 'rsi',
        operator: 'lt',
        value: 30,
        weight: 0.5
      }
    ],
    positionSize: {
      type: 'percentage',
      value: 5,
      maxRisk: 2
    },
    stopLoss: {
      enabled: true,
      type: 'percentage',
      value: 1.5
    },
    takeProfit: {
      enabled: true,
      targets: [
        { percentage: 50, priceTarget: 3 },
        { percentage: 50, priceTarget: 5 }
      ]
    },
    maxPositions: 3,
    symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']
  },
  
  volatilityBreakout: {
    name: 'Volatility Breakout',
    description: 'Estratégia que busca capturar breakouts de volatilidade após períodos de consolidação',
    enabled: true,
    signalType: 'priceAction',
    entryConditions: [
      {
        type: 'volume',
        operator: 'gt',
        value: 2,
        weight: 0.5
      },
      {
        type: 'explosivePotential',
        operator: 'gte',
        value: 0.7,
        weight: 0.5
      }
    ],
    exitConditions: [
      {
        type: 'volume',
        operator: 'lt',
        value: 0.8,
        weight: 0.3
      }
    ],
    positionSize: {
      type: 'risk_based',
      value: 100,
      maxRisk: 3
    },
    stopLoss: {
      enabled: true,
      type: 'percentage',
      value: 2
    },
    takeProfit: {
      enabled: true,
      targets: [
        { percentage: 100, priceTarget: 4 }
      ]
    },
    maxPositions: 2,
    symbols: ['BTCUSDT', 'ETHUSDT']
  },
  
  meanReversion: {
    name: 'Mean Reversion',
    description: 'Estratégia que busca capturar reversões à média após movimentos extremos',
    enabled: true,
    signalType: 'priceAction',
    entryConditions: [
      {
        type: 'rsi',
        operator: 'lt',
        value: 30,
        weight: 0.6
      }
    ],
    exitConditions: [
      {
        type: 'rsi',
        operator: 'gt',
        value: 70,
        weight: 0.4
      }
    ],
    positionSize: {
      type: 'percentage',
      value: 5,
      maxRisk: 1.5
    },
    stopLoss: {
      enabled: true,
      type: 'percentage',
      value: 1.5
    },
    takeProfit: {
      enabled: true,
      targets: [
        { percentage: 100, priceTarget: 2.5 }
      ]
    },
    maxPositions: 5,
    symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT']
  },
  
  aiPredictionTrader: {
    name: 'AI Prediction Trader',
    description: 'Estratégia que utiliza previsões de IA para entrar em trades',
    enabled: true,
    signalType: 'aiPrediction',
    entryConditions: [
      {
        type: 'confidence',
        operator: 'gte',
        value: 0.75,
        weight: 0.7
      }
    ],
    exitConditions: [
      {
        type: 'confidence',
        operator: 'lt',
        value: 0.5,
        weight: 0.5
      }
    ],
    positionSize: {
      type: 'percentage',
      value: 7,
      maxRisk: 2
    },
    stopLoss: {
      enabled: true,
      type: 'percentage',
      value: 2
    },
    takeProfit: {
      enabled: true,
      targets: [
        { percentage: 100, priceTarget: 4 }
      ]
    },
    maxPositions: 3,
    symbols: ['BTCUSDT', 'ETHUSDT']
  }
};

export function createStrategyFromTemplate(templateId: string, customizations: Partial<TradingStrategy> = {}): TradingStrategy {
  const template = strategyTemplates[templateId];
  
  if (!template) {
    throw new Error(`Template de estratégia não encontrado: ${templateId}`);
  }
  
  const strategy: TradingStrategy = {
    ...JSON.parse(JSON.stringify(template)),
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...customizations
  };
  
  return strategy;
}

export function getAvailableTemplates(): { id: string; name: string; description: string }[] {
  return Object.entries(strategyTemplates).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description
  }));
}
