
import { useState, useEffect } from 'react';
import { useOnChainAnalysis } from './useOnChainAnalysis';

interface SmartMoneyScoreResult {
  score: number; // De -10 (muito bearish) a +10 (muito bullish)
  sentiment: 'Bearish' | 'Neutral' | 'Bullish';
  loading: boolean;
  factors: string[];
}

export const useSmartMoneyScore = (symbol: string): SmartMoneyScoreResult => {
  const { exchangeFlow, whaleTransactions, loading } = useOnChainAnalysis(symbol);
  const [score, setScore] = useState<number>(0);
  const [sentiment, setSentiment] = useState<'Bearish' | 'Neutral' | 'Bullish'>('Neutral');
  const [factors, setFactors] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !exchangeFlow) {
      return;
    }

    let currentScore = 0;
    const currentFactors: string[] = [];

    // Fator 1: Fluxo líquido de Exchanges (Peso: 5)
    if (exchangeFlow.netFlow < 0) { // Outflow > Inflow
      currentScore += 5;
      currentFactors.push(`Forte saída de exchanges ($${Math.abs(exchangeFlow.netFlow).toFixed(0)} ETH)`);
    } else if (exchangeFlow.netFlow > 0) { // Inflow > Outflow
      currentScore -= 5;
      currentFactors.push(`Forte entrada em exchanges ($${exchangeFlow.netFlow.toFixed(0)} ETH)`);
    } else {
      currentFactors.push("Fluxo de exchanges neutro.");
    }

    // Fator 2: Atividade de Baleias (Peso: 5)
    const whaleOutflow = whaleTransactions
      .filter(tx => !Object.values(tx.to).includes(tx.to.toLowerCase()))
      .reduce((sum, tx) => sum + (parseFloat(tx.value) / 1e18), 0);

    const whaleInflowToExchanges = whaleTransactions
      .filter(tx => Object.values(tx.to).includes(tx.to.toLowerCase()))
      .reduce((sum, tx) => sum + (parseFloat(tx.value) / 1e18), 0);

    if (whaleOutflow > whaleInflowToExchanges) {
      currentScore += 5;
      currentFactors.push("Baleias estão acumulando fora de exchanges.");
    } else if (whaleInflowToExchanges > whaleOutflow) {
      currentScore -= 5;
      currentFactors.push("Baleias estão movendo para exchanges para vender.");
    }

    // Normalizar score para o intervalo de -10 a 10
    const finalScore = Math.max(-10, Math.min(10, currentScore));
    setScore(finalScore);
    setFactors(currentFactors);

    // Definir sentimento
    if (finalScore > 3) {
      setSentiment('Bullish');
    } else if (finalScore < -3) {
      setSentiment('Bearish');
    } else {
      setSentiment('Neutral');
    }

  }, [exchangeFlow, whaleTransactions, loading]);

  return { score, sentiment, loading, factors };
};
