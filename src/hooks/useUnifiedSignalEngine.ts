
import { useQuery } from '@tanstack/react-query';
import { 
    getNarratives, 
    calculateHistoricalFlows, 
} from '@/lib/narrativeData';
import { fetchMarketData } from '@/lib/marketData';
import { 
    analyzeCryptoWithPriceAction, 
    predictPriceMovements, 
    PriceActionSignal, 
    Prediction
} from '@/lib/aiModel';

import { NarrativeData, NarrativeFlow } from '@/types/narratives';
import { FlowData } from '@/types/crypto';
import { CryptoFeatures, extractFeatures } from '@/lib/featureExtractor';

export interface UnifiedSignal {
    symbol: string;
    name: string;
    // Scores
    momentumScore: number;      // Curto prazo (price action, volume)
    strengthScore: number;      // Médio prazo (força relativa vs. mercado/narrativa)
    narrativeScore: number;     // Força da narrativa associada
    overallScore: number;       // Pontuação final combinada
    // Sinais Derivados
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    // Dados brutos para UI
    priceAction: PriceActionSignal;
    prediction: Prediction;
}

export interface UnifiedEngineOutput {
    signals: Map<string, UnifiedSignal>;
    narratives: NarrativeData[];
    narrativeFlows: NarrativeFlow[];
    marketFlows: FlowData[];
    isLoading: boolean;
    error: Error | null;
}

// --- LÓGICA DO HOOK ---

export const useUnifiedSignalEngine = (timeframe: string = '24h') => {

    const { data, isLoading, error } = useQuery<UnifiedEngineOutput, Error>({
        queryKey: ['unified-signal-engine', timeframe],
        queryFn: async () => {
            // 1. Buscar todos os dados brutos em paralelo
            const [narratives, marketFlowsRaw] = await Promise.all([
                getNarratives(),
                fetchMarketData(timeframe) // marketFlowsRaw contém CryptoData e FlowData
            ]);

            // marketFlowsRaw é na verdade uma lista de FlowData, mas contém info de CryptoData
            // Precisamos extrair os CryptoData para feature extraction
            const cryptoDataList = marketFlowsRaw.map(flow => ({
                id: flow.to, // Usar 'to' como ID para simplificar, assumindo que é o ativo
                name: flow.name || flow.to,
                symbol: flow.to,
                performance: flow.change || 0,
                price: flow.price || 0,
                volume: flow.volume || 0,
                change24h: flow.change || 0,
            }));

            // 2. Extrair features para todas as criptos
            const cryptoFeatures = await extractFeatures(cryptoDataList, marketFlowsRaw, timeframe);
            
            // 3. Gerar previsões para todas as criptos
            const predictions = predictPriceMovements(cryptoFeatures, timeframe);
            const predictionsMap = new Map<string, Prediction>();
            predictions.forEach(p => predictionsMap.set(p.symbol, p));

            // 4. Calcular fluxos de narrativas
            const narrativeFlows = calculateHistoricalFlows(narratives);

            // 5. Gerar Sinais Unificados para cada cripto
            const signals = new Map<string, UnifiedSignal>();
            
            for (const feature of cryptoFeatures) {
                const prediction = predictionsMap.get(feature.symbol);
                if (!prediction) continue; // Pular se não houver previsão

                // Encontrar a narrativa associada (simplificado: primeira narrativa que contém o token)
                const associatedNarrative = narratives.find(n => n.tokens.includes(feature.symbol));

                // --- Lógica de Pontuação Aprimorada ---
                let momentumScore = 50;
                // Impacto de price action signals
                if (prediction.isAccelerating) momentumScore += 15;
                if (prediction.isBreakout) momentumScore += 10;
                if (prediction.isExpansion) momentumScore += 5;
                // Impacto de mudanças de preço e volume
                momentumScore += (feature.priceChange1h || 0) * 2; // Mais peso para 1h
                momentumScore += (feature.priceChange24h || 0) * 1;
                momentumScore += (feature.volumeChange24h || 0) * 0.1; // Volume
                // Impacto de indicadores técnicos
                if (feature.obv > 0) momentumScore += 5; else if (feature.obv < 0) momentumScore -= 5;
                if (feature.macdHistogram > 0) momentumScore += 5; else if (feature.macdHistogram < 0) momentumScore -= 5;
                momentumScore = Math.max(0, Math.min(100, momentumScore));

                let strengthScore = 50;
                // Impacto de fluxo de capital
                strengthScore += (feature.netFlowPercentage || 0) * 0.5; // Fluxo líquido
                if (feature.incomingFlows > feature.outgoingFlows) strengthScore += 10;
                if (feature.exchangeOutflow > feature.exchangeInflow) strengthScore += 5; // Saída de exchange é bullish
                // Impacto de RSI (inverso para sobrecompra/venda)
                if (feature.rsi < 30) strengthScore += 10; // Sobrevendido é bullish
                if (feature.rsi > 70) strengthScore -= 10; // Sobrecomprado é bearish
                strengthScore = Math.max(0, Math.min(100, strengthScore));

                let narrativeScore = 50;
                if (associatedNarrative) {
                    // Impacto da performance da narrativa
                    narrativeScore += (associatedNarrative.change24h || 0) * 1.5; 
                    // Impacto da dominância da narrativa
                    narrativeScore += (associatedNarrative.dominance || 0) * 0.2; 
                    // Impacto do volume da narrativa (normalizado pelo market cap)
                    if (associatedNarrative.marketCap > 0) {
                        narrativeScore += (associatedNarrative.volume24h / associatedNarrative.marketCap) * 1000; // Ajustar multiplicador
                    }
                }
                narrativeScore = Math.max(0, Math.min(100, narrativeScore));

                // Ponderação dos scores para o overallScore
                const overallScore = (
                    momentumScore * 0.45 + 
                    strengthScore * 0.35 + 
                    narrativeScore * 0.20
                );

                let recommendation: UnifiedSignal['recommendation'] = 'hold';
                if (overallScore >= 80 && prediction.confidence >= 0.8) recommendation = 'strong_buy';
                else if (overallScore >= 65 && prediction.confidence >= 0.65) recommendation = 'buy';
                else if (overallScore <= 20 && prediction.confidence >= 0.8) recommendation = 'strong_sell';
                else if (overallScore <= 35 && prediction.confidence >= 0.65) recommendation = 'sell';
                // Se a confiança for baixa, mesmo com score alto, pode ser hold
                else if (prediction.confidence < 0.5) recommendation = 'hold';

                signals.set(feature.symbol, {
                    symbol: feature.symbol,
                    name: prediction.name || feature.symbol,
                    momentumScore,
                    strengthScore,
                    narrativeScore,
                    overallScore,
                    recommendation,
                    confidence: prediction.confidence,
                    priceAction: { 
                        symbol: prediction.symbol,
                        explosivePotential: prediction.explosivePotential || 'None',
                        isBreakout: prediction.isBreakout || false,
                        isExpansion: prediction.isExpansion || false,
                        isAccelerating: prediction.isAccelerating || false,
                        lastUpdated: Date.now(),
                    },
                    prediction,
                });
            }

            return { 
                signals, 
                narratives, 
                narrativeFlows, 
                marketFlows: marketFlowsRaw, 
                isLoading: false, 
                error: null 
            };
        },
        refetchInterval: 60 * 1000, // 1 minuto
        staleTime: 30 * 1000,
    });

    return { ...data, isLoading, error };
};
