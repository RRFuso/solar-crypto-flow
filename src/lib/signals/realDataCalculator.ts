import { CryptoData } from '@/types/crypto';
import { supabase } from '@/integrations/supabase/client';

/**
 * Calculadora de dados reais para substituir aproximações mockadas
 */
export class RealDataCalculator {
  private static instance: RealDataCalculator;
  private historicalCache: Map<string, any> = new Map();
  
  public static getInstance(): RealDataCalculator {
    if (!RealDataCalculator.instance) {
      RealDataCalculator.instance = new RealDataCalculator();
    }
    return RealDataCalculator.instance;
  }

  /**
   * Calcula volume médio real baseado em dados históricos
   */
  async calculateRealAverageVolume(symbol: string, days: number = 7): Promise<number> {
    try {
      const cacheKey = `${symbol}_volume_${days}d`;
      
      if (this.historicalCache.has(cacheKey)) {
        const cached = this.historicalCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutos cache
          return cached.value;
        }
      }

      const { data, error } = await supabase
        .from('crypto_historical_data')
        .select('volume')
        .eq('symbol', symbol)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        return 0;
      }

      const volumes = data.map(d => Number(d.volume)).filter(v => v > 0);
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      
      // Cache result
      this.historicalCache.set(cacheKey, {
        value: avgVolume,
        timestamp: Date.now()
      });

      return avgVolume || 0;
    } catch (error) {
      console.error(`Erro ao calcular volume médio para ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Calcula suporte e resistência reais baseados em dados históricos
   */
  async calculateSupportResistance(symbol: string, days: number = 30): Promise<{
    support: number;
    resistance: number;
    confidence: number;
  }> {
    try {
      const cacheKey = `${symbol}_sr_${days}d`;
      
      if (this.historicalCache.has(cacheKey)) {
        const cached = this.historicalCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 600000) { // 10 minutos cache
          return cached.value;
        }
      }

      const { data, error } = await supabase
        .from('crypto_historical_data')
        .select('high, low, close')
        .eq('symbol', symbol)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });

      if (error || !data || data.length < 10) {
        return { support: 0, resistance: 0, confidence: 0 };
      }

      const prices = data.map(d => ({
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close)
      })).filter(p => p.high > 0 && p.low > 0);

      if (prices.length === 0) {
        return { support: 0, resistance: 0, confidence: 0 };
      }

      // Calcular níveis de suporte e resistência usando pivots
      const pivotPoints = this.calculatePivotPoints(prices);
      const supportLevels = pivotPoints.filter(p => p.type === 'support').map(p => p.price);
      const resistanceLevels = pivotPoints.filter(p => p.type === 'resistance').map(p => p.price);

      const support = supportLevels.length > 0 ? 
        supportLevels.reduce((sum, level) => sum + level, 0) / supportLevels.length : 
        Math.min(...prices.map(p => p.low));

      const resistance = resistanceLevels.length > 0 ? 
        resistanceLevels.reduce((sum, level) => sum + level, 0) / resistanceLevels.length : 
        Math.max(...prices.map(p => p.high));

      const confidence = Math.min(1, (supportLevels.length + resistanceLevels.length) / 10);

      const result = { support, resistance, confidence };
      
      // Cache result
      this.historicalCache.set(cacheKey, {
        value: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Erro ao calcular suporte/resistência para ${symbol}:`, error);
      return { support: 0, resistance: 0, confidence: 0 };
    }
  }

  /**
   * Calcula volatilidade real baseada em dados históricos
   */
  async calculateRealVolatility(symbol: string, days: number = 30): Promise<number> {
    try {
      const cacheKey = `${symbol}_volatility_${days}d`;
      
      if (this.historicalCache.has(cacheKey)) {
        const cached = this.historicalCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 600000) { // 10 minutos cache
          return cached.value;
        }
      }

      const { data, error } = await supabase
        .from('crypto_historical_data')
        .select('close')
        .eq('symbol', symbol)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true });

      if (error || !data || data.length < 2) {
        return 0;
      }

      const closes = data.map(d => Number(d.close)).filter(c => c > 0);
      if (closes.length < 2) return 0;

      // Calcular retornos diários
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        const dailyReturn = (closes[i] - closes[i-1]) / closes[i-1];
        returns.push(dailyReturn);
      }

      // Calcular desvio padrão dos retornos (volatilidade)
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(365); // Anualizada

      // Cache result
      this.historicalCache.set(cacheKey, {
        value: volatility,
        timestamp: Date.now()
      });

      return volatility;
    } catch (error) {
      console.error(`Erro ao calcular volatilidade para ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Identifica pontos de pivot para suporte e resistência
   */
  private calculatePivotPoints(prices: Array<{high: number, low: number, close: number}>): Array<{
    price: number;
    type: 'support' | 'resistance';
    strength: number;
  }> {
    const pivots: Array<{price: number; type: 'support' | 'resistance'; strength: number}> = [];
    const lookback = 5; // Períodos para identificar pivots

    for (let i = lookback; i < prices.length - lookback; i++) {
      const current = prices[i];
      
      // Verificar se é um pivot de máxima (resistência)
      let isHigh = true;
      let highStrength = 0;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && prices[j].high >= current.high) {
          isHigh = false;
          break;
        }
        if (j !== i) highStrength++;
      }

      if (isHigh) {
        pivots.push({
          price: current.high,
          type: 'resistance',
          strength: highStrength / (lookback * 2)
        });
      }

      // Verificar se é um pivot de mínima (suporte)
      let isLow = true;
      let lowStrength = 0;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && prices[j].low <= current.low) {
          isLow = false;
          break;
        }
        if (j !== i) lowStrength++;
      }

      if (isLow) {
        pivots.push({
          price: current.low,
          type: 'support',
          strength: lowStrength / (lookback * 2)
        });
      }
    }

    return pivots.filter(p => p.strength > 0.7); // Apenas pivots com alta confiança
  }
}

export const realDataCalculator = RealDataCalculator.getInstance();