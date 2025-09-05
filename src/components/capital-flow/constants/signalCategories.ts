export interface SignalCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  emoji: string;
}

// Sistema de cores HSL consistente com cores distintas
export const SIGNAL_CATEGORIES: Record<string, SignalCategory> = {
  explosive: {
    id: 'explosive',
    name: 'Potencial Explosivo',
    color: 'hsl(270, 85%, 65%)', // Roxo vibrante
    description: 'Alta probabilidade de movimento explosivo',
    emoji: '🚀'
  },
  accumulation: {
    id: 'accumulation', 
    name: 'Acumulação',
    color: 'hsl(142, 76%, 55%)', // Verde padrão
    description: 'Fase de acumulação inteligente',
    emoji: '🧱'
  },
  distribution: {
    id: 'distribution',
    name: 'Distribuição', 
    color: 'hsl(45, 93%, 55%)', // Amarelo/Dourado
    description: 'Fase de distribuição - possível topo',
    emoji: '📊'
  },
  reversal: {
    id: 'reversal',
    name: 'Reversão de Fundo',
    color: 'hsl(195, 90%, 55%)', // Azul turquesa forte - bem distinto do verde
    description: 'Sinal de reversão de tendência de baixa',
    emoji: '🔁'
  },
  capitulation: {
    id: 'capitulation',
    name: 'Capitulação',
    color: 'hsl(0, 85%, 60%)', // Vermelho puro
    description: 'Venda em pânico - possível fundo',
    emoji: '📉'
  },
  neutral: {
    id: 'neutral',
    name: 'Neutro',
    color: 'hsl(220, 15%, 60%)', // Cinza neutro
    description: 'Sem sinal claro definido',
    emoji: '⚪'
  }
};

// Mapeamento de recomendações AI para categorias de sinais
export const AI_RECOMMENDATION_TO_SIGNAL: Record<string, string> = {
  'strong_buy': 'explosive',
  'buy': 'accumulation', 
  'hold': 'neutral',
  'sell': 'distribution',
  'strong_sell': 'capitulation'
};

// Função para obter cor por categoria
export const getCategoryColor = (category: string): string => {
  return SIGNAL_CATEGORIES[category]?.color || SIGNAL_CATEGORIES.neutral.color;
};

// Função para mapear recomendação AI para categoria de sinal
export const mapAIRecommendationToSignal = (recommendation: string): string => {
  return AI_RECOMMENDATION_TO_SIGNAL[recommendation] || 'neutral';
};

// Função para obter categoria baseada em dados de criptomoeda
export const determineCryptoSignalCategory = (crypto: any): string => {
  const priceChange24h = crypto.priceChange24h || 0;
  const volume = crypto.volume || 0;
  const rsi = crypto.rsi || 50;
  
  // Lógica para determinar categoria baseada em métricas
  if (priceChange24h > 15 && volume > 50000000) return 'explosive';
  if (priceChange24h < -20 && rsi < 25) return 'capitulation';
  if (priceChange24h > 5 && rsi > 70) return 'distribution';
  if (priceChange24h > 0 && rsi < 40) return 'accumulation';
  if (priceChange24h < 0 && rsi < 35) return 'reversal';
  
  return 'neutral';
};