import { CryptoData } from '@/types/crypto';
import { 
  ExplosiveSignal, 
  EdgeSignal, 
  BottomSignal, 
  OnChainData,
  PredictiveSignalAggregated 
} from '@/types/predictiveSignals';

export class RealTimeSignalProcessor {
  
  // Processar sinais explosivos baseados em dados de mercado
  static processExplosiveSignals(crypto: CryptoData): ExplosiveSignal[] {
    const signals: ExplosiveSignal[] = [];
    
    // Verificar condições para sinal explosivo
    const volumeRatio = crypto.volume24h && crypto.avgVolume24h ? 
      crypto.volume24h / crypto.avgVolume24h : 1;
    
    const priceChange = crypto.change24h || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal explosivo de alta
    if (volumeRatio > 2.5 && priceChange > 5 && rsi > 45 && rsi < 75) {
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
    
    return signals;
  }
  
  // Processar sinais de borda (accumulation/distribution)
  static processEdgeSignals(crypto: CryptoData): EdgeSignal[] {
    const signals: EdgeSignal[] = [];
    
    const volumeRatio = crypto.volume24h && crypto.avgVolume24h ? 
      crypto.volume24h / crypto.avgVolume24h : 1;
    const priceChange = crypto.change24h || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal de acumulação
    if (rsi < 35 && volumeRatio > 1.5 && priceChange > -5 && priceChange < 2) {
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
    
    // Sinal de distribuição
    if (rsi > 70 && volumeRatio > 2 && priceChange > 5) {
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
    
    const volumeRatio = crypto.volume24h && crypto.avgVolume24h ? 
      crypto.volume24h / crypto.avgVolume24h : 1;
    const priceChange = crypto.change24h || 0;
    const rsi = crypto.rsi || 50;
    
    // Sinal de reversão de fundo
    if (rsi < 30 && priceChange < -5 && priceChange > -15 && volumeRatio > 1.5) {
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
    
    // Sinal de capitulação
    if (rsi < 25 && priceChange < -15 && volumeRatio > 3) {
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
    const volumeRatio = crypto.volume24h && crypto.avgVolume24h ? 
      crypto.volume24h / crypto.avgVolume24h : 1;
    const priceChange = crypto.change24h || 0;
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