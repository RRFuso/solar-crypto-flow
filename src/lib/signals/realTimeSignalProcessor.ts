import { CryptoData } from '@/types/crypto';
import { 
  ExplosiveSignal, 
  EdgeSignal, 
  BottomSignal, 
  OnChainData,
  PredictiveSignalAggregated 
} from '@/types/predictiveSignals';
import { BollingerBands } from '@/lib/indicators/BollingerBands';
import { MACD } from '@/lib/indicators/MACD';

export class RealTimeSignalProcessor {
  
  // Processar sinais explosivos baseados em dados de mercado
  static processExplosiveSignals(crypto: CryptoData): ExplosiveSignal[] {
    const signals: ExplosiveSignal[] = [];
    
    // Verificar condições para sinal explosivo
    const volume24h = crypto.volume24h || crypto.volume || 0;
    const avgVolume = crypto.avgVolume24h || (volume24h * 0.8); // Fallback se não tiver histórico
    const volumeRatio = avgVolume > 0 ? volume24h / avgVolume : 1;
    
    const priceChange = crypto.change24h || crypto.priceChange24h || crypto.performance || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal explosivo de alta (condições mais flexíveis)
    if (volumeRatio > 1.5 && priceChange > 2 && rsi > 40 && rsi < 80) {
      const factors = [];
      
      if (volumeRatio > 3) factors.push(`Volume ${volumeRatio.toFixed(1)}x acima da média`);
      if (priceChange > 10) factors.push('Breakout técnico detectado');
      if (rsi > 45 && rsi < 65) factors.push(`RSI em zona saudável (${rsi.toFixed(0)})`);
      if (crypto.marketCap && crypto.marketCap > 1000000000) factors.push('Large cap stability');
      
      signals.push({
        symbol: crypto.symbol || '',
        signalType: 'explosive_upside',
        confidence: Math.min(0.95, 0.5 + (volumeRatio - 2) * 0.1 + (priceChange / 100)),
        factors,
        riskLevel: crypto.marketCap && crypto.marketCap > 5000000000 ? 'low' : 'medium',
        targetGain: Math.min(50, priceChange * 2 + volumeRatio * 5),
        timeframe: volumeRatio > 4 ? '1h' : '4h',
        timestamp: new Date().toISOString()
      });
    }

    // Bollinger Bands squeeze + breakout (requer priceHistory)
    const prices = crypto.priceHistory || [];
    if (prices.length >= 20) {
      try {
        const bb = BollingerBands.calculate(prices);
        if (bb.isSqueeze && bb.signal === 'buy' && bb.confidence > 0.7) {
          const bw = bb.bandwidth[bb.bandwidth.length - 1];
          signals.push({
            symbol: crypto.symbol || '',
            signalType: 'explosive_upside',
            confidence: bb.confidence,
            factors: [
              'Bollinger Bands squeeze detectado',
              'Breakout acima da banda superior',
              `Bandwidth: ${bw.toFixed(2)}%`,
              `%B: ${bb.percentB.toFixed(0)}%`,
            ],
            riskLevel: 'medium',
            targetGain: 15 + bb.confidence * 20,
            timeframe: '4h',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // dados insuficientes — ignorar silenciosamente
      }
    }

    return signals;
  }
  
  // Processar sinais de borda (accumulation/distribution)
  static processEdgeSignals(crypto: CryptoData): EdgeSignal[] {
    const signals: EdgeSignal[] = [];
    
    const volume24h = crypto.volume24h || crypto.volume || 0;
    const avgVolume = crypto.avgVolume24h || (volume24h * 0.8);
    const volumeRatio = avgVolume > 0 ? volume24h / avgVolume : 1;
    
    const priceChange = crypto.change24h || crypto.priceChange24h || crypto.performance || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal de acumulação (condições mais flexíveis)
    if (rsi < 45 && volumeRatio > 1.2 && priceChange > -10 && priceChange < 5) {
      signals.push({
        symbol: crypto.symbol || '',
        signalType: 'accumulation_edge',
        strength: Math.min(0.95, 0.4 + (40 - rsi) * 0.015 + volumeRatio * 0.1),
        phase: rsi < 25 ? 'early' : rsi < 30 ? 'middle' : 'late',
        volumeAnomaly: volumeRatio > 2,
        smartMoneyFlow: rsi < 30 ? 'in' : 'neutral',
        timestamp: new Date().toISOString()
      });
    }
    
    // Sinal de distribuição (condições mais flexíveis)
    if (rsi > 60 && volumeRatio > 1.3 && priceChange > 2) {
      signals.push({
        symbol: crypto.symbol || '',
        signalType: 'distribution_edge',
        strength: Math.min(0.95, 0.4 + (rsi - 70) * 0.02 + volumeRatio * 0.1),
        phase: rsi > 85 ? 'late' : rsi > 75 ? 'middle' : 'early',
        volumeAnomaly: volumeRatio > 3,
        smartMoneyFlow: rsi > 80 ? 'out' : 'neutral',
        timestamp: new Date().toISOString()
      });
    }
    
    return signals;
  }
  
  // Processar sinais de fundo
  static processBottomSignals(crypto: CryptoData): BottomSignal[] {
    const signals: BottomSignal[] = [];
    
    const volume24h = crypto.volume24h || crypto.volume || 0;
    const avgVolume = crypto.avgVolume24h || (volume24h * 0.8);
    const volumeRatio = avgVolume > 0 ? volume24h / avgVolume : 1;
    
    const priceChange = crypto.change24h || crypto.priceChange24h || crypto.performance || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal de reversão de fundo (condições mais flexíveis)
    if (rsi < 40 && priceChange < -2 && priceChange > -20 && volumeRatio > 1.2) {
      signals.push({
        symbol: crypto.symbol || '',
        signalType: 'reversal_bottom',
        confidence: Math.min(0.95, 0.5 + (30 - rsi) * 0.02 + volumeRatio * 0.1),
        supportLevel: (crypto.price || 0) * 0.95, // Aproximação do suporte
        volumeProfile: volumeRatio > 2.5 ? 'spike' : 'normal',
        rsiDivergence: rsi < 25 && priceChange > -10,
        timestamp: new Date().toISOString()
      });
    }
    
    // Sinal de capitulação (condições mais flexíveis)
    if (rsi < 35 && priceChange < -8 && volumeRatio > 1.5) {
      signals.push({
        symbol: crypto.symbol || '',
        signalType: 'capitulation_bottom',
        confidence: Math.min(0.95, 0.6 + (25 - rsi) * 0.03 + volumeRatio * 0.05),
        supportLevel: (crypto.price || 0) * 0.90,
        volumeProfile: 'spike',
        rsiDivergence: false,
        timestamp: new Date().toISOString()
      });
    }
    
    return signals;
  }
  
  // Gerar dados on-chain simulados baseados em condições de mercado
  static generateOnChainData(crypto: CryptoData): OnChainData {
    const volume24h = crypto.volume24h || crypto.volume || 0;
    const avgVolume = crypto.avgVolume24h || (volume24h * 0.8);
    const volumeRatio = avgVolume > 0 ? volume24h / avgVolume : 1;
    
    const priceChange = crypto.change24h || crypto.priceChange24h || crypto.performance || 0;
    const rsi = crypto.rsi || 50;
    
    // Calcular atividade de baleias baseada em volume e volatilidade
    const whaleActivity = Math.min(100, Math.max(0, 
      (volumeRatio - 1) * 30 + Math.abs(priceChange) * 2
    ));
    
    // Scores de acumulação e distribuição
    const accumulationScore = rsi < 40 ? Math.min(100, (40 - rsi) * 3 + volumeRatio * 10) : 0;
    const distributionScore = rsi > 70 ? Math.min(100, (rsi - 70) * 3 + volumeRatio * 10) : 0;
    
    // Sentiment baseado em RSI e mudança de preço
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (rsi > 55 && priceChange > 2) sentiment = 'bullish';
    else if (rsi < 45 && priceChange < -2) sentiment = 'bearish';
    
    return {
      symbol: crypto.symbol || '',
      whaleActivity: Math.round(whaleActivity),
      exchangeNetFlow: priceChange > 5 ? -Math.abs(priceChange) * 1000000 : 
                       priceChange < -5 ? Math.abs(priceChange) * 1000000 : 0,
      accumulationScore: Math.round(accumulationScore),
      distributionScore: Math.round(distributionScore),
      smartMoneySentiment: sentiment,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Processar todos os sinais para uma crypto
  static processAllSignals(crypto: CryptoData): PredictiveSignalAggregated {
    const explosiveSignals = this.processExplosiveSignals(crypto);
    const edgeSignals = this.processEdgeSignals(crypto);
    const bottomSignals = this.processBottomSignals(crypto);
    const onChainData = this.generateOnChainData(crypto);
    
    // Calcular score geral
    const allSignals = [...explosiveSignals, ...edgeSignals, ...bottomSignals];
    const totalConfidence = allSignals.reduce((sum, signal) => {
      const signalStrength = 'confidence' in signal ? signal.confidence : 
                            'strength' in signal ? signal.strength : 0;
      return sum + signalStrength;
    }, 0);
    
    const overallScore = Math.min(100, allSignals.length > 0 ? 
      (totalConfidence / allSignals.length) * 100 : 0);
    
    // Determinar ação recomendada
    let recommendedAction: 'buy' | 'sell' | 'hold' | 'watch' = 'watch';
    let riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' = 'medium';
    
    if (explosiveSignals.length > 0 && explosiveSignals[0].confidence > 0.7) {
      recommendedAction = 'buy';
      riskLevel = explosiveSignals[0].riskLevel === 'low' ? 'low' : 'medium';
    } else if (edgeSignals.some(s => s.signalType === 'distribution_edge' && s.strength > 0.6)) {
      recommendedAction = 'sell';
      riskLevel = 'medium';
    } else if (bottomSignals.length > 0 && bottomSignals[0].confidence > 0.6) {
      recommendedAction = 'buy';
      riskLevel = 'low';
    } else if (overallScore > 60) {
      recommendedAction = 'hold';
    }
    
    return {
      symbol: crypto.symbol || '',
      explosiveSignals,
      edgeSignals,
      bottomSignals,
      onChainData,
      overallScore,
      recommendedAction,
      riskLevel,
      timestamp: new Date().toISOString()
    };
  }
}