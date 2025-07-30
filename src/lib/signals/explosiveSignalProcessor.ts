import { CryptoData } from '@/types/crypto';
import { ExplosiveSignal, EdgeSignal, BottomSignal, OnChainData } from '@/types/predictiveSignals';
import { calculateRSI, calculateEMA, calculateMACD } from '@/lib/technical';

interface ProcessorConfig {
  explosiveThresholds: {
    volumeMultiplier: number;
    priceChange: number;
    rsiRange: [number, number];
    marketCapMax: number;
  };
  edgeThresholds: {
    accumulationVolume: number;
    distributionVolume: number;
    rsiOversold: number;
    rsiOverbought: number;
  };
  bottomThresholds: {
    reversalRsiMin: number;
    capitulationVolumeMultiplier: number;
    supportBreakdown: number;
  };
}

const DEFAULT_CONFIG: ProcessorConfig = {
  explosiveThresholds: {
    volumeMultiplier: 2.5,
    priceChange: 8,
    rsiRange: [30, 70],
    marketCapMax: 1_000_000_000 // $1B
  },
  edgeThresholds: {
    accumulationVolume: 0.8,
    distributionVolume: 1.5,
    rsiOversold: 30,
    rsiOverbought: 70
  },
  bottomThresholds: {
    reversalRsiMin: 25,
    capitulationVolumeMultiplier: 3.0,
    supportBreakdown: 5
  }
};

export class ExplosiveSignalProcessor {
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  processExplosiveSignals(
    crypto: CryptoData,
    onChainData?: OnChainData
  ): ExplosiveSignal | null {
    try {
      // Calcular indicadores técnicos necessários
      const rsi = crypto.rsi || 50;
      const factors: string[] = [];
      let confidence = 0;

      // Critério 1: Volume acima da média (usando volume atual como base)
      const avgVolume = crypto.volume24h * 0.7; // Aproximação para volume médio
      const volumeMultiplier = crypto.volume24h / avgVolume;
      if (volumeMultiplier >= this.config.explosiveThresholds.volumeMultiplier) {
        factors.push(`Volume ${volumeMultiplier.toFixed(1)}x acima da média`);
        confidence += 0.25;
      }

      // Critério 2: Mudança de preço significativa
      if (crypto.change24h >= this.config.explosiveThresholds.priceChange) {
        factors.push(`Alta de ${crypto.change24h.toFixed(1)}% em 24h`);
        confidence += 0.25;
      }

      // Critério 3: RSI em zona saudável (não sobrecomprado)
      if (rsi >= this.config.explosiveThresholds.rsiRange[0] && 
          rsi <= this.config.explosiveThresholds.rsiRange[1]) {
        factors.push(`RSI em zona saudável (${rsi.toFixed(0)})`);
        confidence += 0.2;
      }

      // Critério 4: Market cap baixo/médio (maior potencial)
      if (crypto.marketCap && crypto.marketCap <= this.config.explosiveThresholds.marketCapMax) {
        factors.push('Market cap com potencial de crescimento');
        confidence += 0.15;
      }

      // Critério 5: Dados on-chain favoráveis
      if (onChainData) {
        if (onChainData.smartMoneySentiment === 'bullish') {
          factors.push('Smart money bullish');
          confidence += 0.15;
        }
        if (onChainData.accumulationScore > 60) {
          factors.push('Alta acumulação detectada');
          confidence += 0.1;
        }
      }

      // Critério 6: Breakout técnico (verificação simplificada)
      if (crypto.change24h > 5 && crypto.price > crypto.low24h * 1.1) {
        factors.push('Breakout técnico detectado');
        confidence += 0.1;
      }

      // Só retorna sinal se tiver confiança mínima
      if (confidence >= 0.6 && factors.length >= 3) {
        return {
          symbol: crypto.symbol,
          signalType: 'explosive_upside',
          confidence: Math.min(confidence, 1),
          factors,
          riskLevel: confidence > 0.8 ? 'low' : confidence > 0.7 ? 'medium' : 'high',
          targetGain: this.calculateTargetGain(crypto, confidence),
          timeframe: '4h',
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error(`Erro ao processar sinal explosivo para ${crypto.symbol}:`, error);
      return null;
    }
  }

  processEdgeSignals(
    crypto: CryptoData,
    onChainData?: OnChainData
  ): EdgeSignal | null {
    try {
      const rsi = crypto.rsi || 50;
      const avgVolume = crypto.volume24h * 0.7; // Aproximação
      const volumeRatio = crypto.volume24h / avgVolume;

      // Sinal de Acumulação
      if (rsi <= this.config.edgeThresholds.rsiOversold && 
          volumeRatio <= this.config.edgeThresholds.accumulationVolume &&
          Math.abs(crypto.change24h) <= 3) {
        
        let strength = 0.5;
        if (onChainData?.accumulationScore > 50) strength += 0.3;
        if (onChainData?.exchangeNetFlow < -1000000) strength += 0.2; // Saída de exchanges

        return {
          symbol: crypto.symbol,
          signalType: 'accumulation_edge',
          strength: Math.min(strength, 1),
          phase: strength > 0.8 ? 'late' : strength > 0.5 ? 'middle' : 'early',
          volumeAnomaly: volumeRatio < 0.5,
          smartMoneyFlow: onChainData?.exchangeNetFlow < 0 ? 'out' : 'neutral',
          timestamp: new Date().toISOString()
        };
      }

      // Sinal de Distribuição
      if (rsi >= this.config.edgeThresholds.rsiOverbought && 
          volumeRatio >= this.config.edgeThresholds.distributionVolume &&
          crypto.change24h > 0) {
        
        let strength = 0.5;
        if (onChainData?.distributionScore > 50) strength += 0.3;
        if (onChainData?.exchangeNetFlow > 1000000) strength += 0.2; // Entrada em exchanges

        return {
          symbol: crypto.symbol,
          signalType: 'distribution_edge',
          strength: Math.min(strength, 1),
          phase: strength > 0.8 ? 'late' : strength > 0.5 ? 'middle' : 'early',
          volumeAnomaly: volumeRatio > 2,
          smartMoneyFlow: onChainData?.exchangeNetFlow > 0 ? 'in' : 'neutral',
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error(`Erro ao processar edge signals para ${crypto.symbol}:`, error);
      return null;
    }
  }

  processBottomSignals(
    crypto: CryptoData,
    onChainData?: OnChainData
  ): BottomSignal | null {
    try {
      const rsi = crypto.rsi || 50;
      const avgVolume = crypto.volume24h * 0.7; // Aproximação
      const volumeRatio = crypto.volume24h / avgVolume;

      // Fundo de Reversão
      if (rsi >= this.config.bottomThresholds.reversalRsiMin &&
          rsi <= 40 &&
          crypto.change24h < 0 &&
          volumeRatio < 1.2) {
        
        let confidence = 0.4;
        
        // RSI divergência (simplificado)
        const rsiDivergence = rsi > 30 && crypto.change24h < -2;
        if (rsiDivergence) confidence += 0.3;
        
        // Support level detection (simplificado)
        const supportLevel = crypto.low24h;
        if (Math.abs(crypto.price - supportLevel) / crypto.price < 0.02) {
          confidence += 0.3;
        }

        if (confidence >= 0.6) {
          return {
            symbol: crypto.symbol,
            signalType: 'reversal_bottom',
            confidence: Math.min(confidence, 1),
            supportLevel,
            volumeProfile: 'decreasing',
            rsiDivergence,
            timestamp: new Date().toISOString()
          };
        }
      }

      // Fundo de Capitulação
      if (crypto.change24h <= -15 &&
          volumeRatio >= this.config.bottomThresholds.capitulationVolumeMultiplier &&
          rsi <= 25) {
        
        const confidence = Math.min(0.9, 0.5 + (Math.abs(crypto.change24h) / 30));
        
        return {
          symbol: crypto.symbol,
          signalType: 'capitulation_bottom',
          confidence,
          supportLevel: crypto.low24h,
          volumeProfile: 'spike',
          rsiDivergence: false,
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error(`Erro ao processar bottom signals para ${crypto.symbol}:`, error);
      return null;
    }
  }

  private calculateTargetGain(crypto: CryptoData, confidence: number): number {
    // Cálculo simplificado de ganho esperado baseado em confiança e market cap
    const baseGain = confidence * 50; // 0-50%
    
    if (crypto.marketCap) {
      if (crypto.marketCap < 100_000_000) return baseGain * 2; // Small cap
      if (crypto.marketCap < 1_000_000_000) return baseGain * 1.5; // Mid cap
    }
    
    return baseGain; // Large cap
  }
}

export const explosiveSignalProcessor = new ExplosiveSignalProcessor();