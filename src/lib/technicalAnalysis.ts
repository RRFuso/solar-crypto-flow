// Função para calcular o RSI
export function calculateRSI(prices: number[], periods: number = 14): number {
  if (prices.length < periods + 1) {
    return 50; // Valor padrão se não houver dados suficientes
  }

  let gains = 0;
  let losses = 0;

  // Calcular ganhos e perdas iniciais
  for (let i = 1; i <= periods; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  // Calcular médias iniciais
  let avgGain = gains / periods;
  let avgLoss = losses / periods;

  // Calcular para o restante dos períodos
  for (let i = periods + 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    
    if (difference >= 0) {
      avgGain = (avgGain * (periods - 1) + difference) / periods;
      avgLoss = (avgLoss * (periods - 1)) / periods;
    } else {
      avgGain = (avgGain * (periods - 1)) / periods;
      avgLoss = (avgLoss * (periods - 1) - difference) / periods;
    }
  }

  if (avgLoss === 0) {
    return 100;
  }

  const RS = avgGain / avgLoss;
  return 100 - (100 / (1 + RS));
}

// Função para calcular EMA
export function calculateEMA(prices: number[], periods: number): number {
  if (prices.length < periods) {
    return prices[prices.length - 1]; // Retorna o último preço se não houver dados suficientes
  }

  const multiplier = 2 / (periods + 1);
  let ema = prices.slice(0, periods).reduce((sum, price) => sum + price, 0) / periods;

  for (let i = periods; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Função para verificar se está acima da média móvel
export function isAboveMA(prices: number[], periods: number = 14): boolean {
  if (prices.length < periods) {
    return false;
  }

  const ma = prices.slice(-periods).reduce((sum, price) => sum + price, 0) / periods;
  return prices[prices.length - 1] > ma;
}