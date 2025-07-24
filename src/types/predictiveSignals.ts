// Tipos para sinais preditivos otimizados

export interface ExplosiveSignal {
  symbol: string;
  signalType: 'explosive_upside';
  confidence: number; // 0-1
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  targetGain: number; // Percentual esperado
  timeframe: string; // '1h', '4h', '1d'
  timestamp: string;
}

export interface EdgeSignal {
  symbol: string;
  signalType: 'accumulation_edge' | 'distribution_edge';
  strength: number; // 0-1
  phase: 'early' | 'middle' | 'late';
  volumeAnomaly: boolean;
  smartMoneyFlow: 'in' | 'out' | 'neutral';
  timestamp: string;
}

export interface BottomSignal {
  symbol: string;
  signalType: 'reversal_bottom' | 'capitulation_bottom';
  confidence: number; // 0-1
  supportLevel: number;
  volumeProfile: 'decreasing' | 'spike' | 'normal';
  rsiDivergence: boolean;
  timestamp: string;
}

export interface OnChainData {
  symbol: string;
  whaleActivity: number; // 0-100
  exchangeNetFlow: number; // Negativo = saída, Positivo = entrada
  accumulationScore: number; // 0-100
  distributionScore: number; // 0-100
  smartMoneySentiment: 'bullish' | 'bearish' | 'neutral';
  lastUpdated: string;
}

export interface PredictiveSignalAggregated {
  symbol: string;
  explosiveSignals: ExplosiveSignal[];
  edgeSignals: EdgeSignal[];
  bottomSignals: BottomSignal[];
  onChainData: OnChainData | null;
  overallScore: number; // 0-100
  recommendedAction: 'buy' | 'sell' | 'hold' | 'watch';
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  timestamp: string;
}

export interface SignalColor {
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

export const SIGNAL_COLORS: Record<string, SignalColor> = {
  explosive_upside: {
    primary: 'hsl(14, 89%, 55%)', // Vermelho/Laranja brilhante
    secondary: 'hsl(14, 89%, 70%)',
    text: 'hsl(0, 0%, 100%)',
    background: 'hsl(14, 89%, 95%)'
  },
  accumulation_edge: {
    primary: 'hsl(142, 76%, 55%)', // Verde claro
    secondary: 'hsl(142, 76%, 70%)',
    text: 'hsl(0, 0%, 100%)',
    background: 'hsl(142, 76%, 95%)'
  },
  distribution_edge: {
    primary: 'hsl(45, 93%, 55%)', // Amarelo
    secondary: 'hsl(45, 93%, 70%)',
    text: 'hsl(0, 0%, 0%)',
    background: 'hsl(45, 93%, 95%)'
  },
  reversal_bottom: {
    primary: 'hsl(142, 83%, 35%)', // Verde escuro
    secondary: 'hsl(142, 83%, 50%)',
    text: 'hsl(0, 0%, 100%)',
    background: 'hsl(142, 83%, 95%)'
  },
  capitulation_bottom: {
    primary: 'hsl(220, 83%, 35%)', // Azul escuro
    secondary: 'hsl(220, 83%, 50%)',
    text: 'hsl(0, 0%, 100%)',
    background: 'hsl(220, 83%, 95%)'
  }
};

export interface SignalConfig {
  enabled: boolean;
  minConfidence: number;
  alertsEnabled: boolean;
  autoTrade: boolean;
}

export interface PredictiveSignalsConfig {
  explosive: SignalConfig;
  edge: SignalConfig;
  bottom: SignalConfig;
  onChainWeight: number; // 0-1
  updateInterval: number; // minutos
}