import { NarrativeData, NarrativeFlow, ModelPrediction, RepresentativeToken } from '@/types/narratives';
import { predictWithModel } from './narrativeModel';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// --- ESTRUTURA BASE DAS NARRATIVAS (SEM DADOS DE MERCADO) ---

const getRepresentativeTokens = (symbols: string[]): RepresentativeToken[] => {
  return symbols.map(symbol => ({
    symbol,
    name: symbol,
    logoUrl: `https://assets.coingecko.com/coins/images/1/thumb/${symbol.toLowerCase()}.png`
  }));
};

// Definição base das narrativas com seus tokens constituintes
const BASE_NARRATIVES: Omit<NarrativeData, 'marketCap' | 'volume24h' | 'dominance' | 'change24h' | 'change7d'>[] = [
    { id: 'ai', name: 'AI', tokens: ['FET', 'OCEAN', 'AGIX', 'RLC', 'NMR', 'GRT', 'RNDR'], representativeTokens: getRepresentativeTokens(['FET', 'OCEAN', 'AGIX']), color: '#FF5733' },
    { id: 'defi', name: 'DeFi', tokens: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CAKE', 'CRV', 'SUSHI', 'BAL'], representativeTokens: getRepresentativeTokens(['UNI', 'AAVE', 'MKR']), color: '#6A0DAD' },
    { id: 'defi-ai', name: 'DeFi AI', tokens: ['INJ', 'TRB', 'RNDR', 'LPT', 'ICP', 'NEAR', 'QNT'], representativeTokens: getRepresentativeTokens(['INJ', 'TRB', 'RNDR']), color: '#3498DB' },
    { id: 'meme', name: 'Meme', tokens: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'MEME'], representativeTokens: getRepresentativeTokens(['DOGE', 'SHIB', 'PEPE']), color: '#F1C40F' },
    { id: 'rwa', name: 'RWA', tokens: ['RWA', 'RNDR', 'LDO', 'PAXG', 'MNT', 'FXS', 'XAUt'], representativeTokens: getRepresentativeTokens(['PAXG', 'MNT', 'FXS']), color: '#27AE60' },
    { id: 'l1', name: 'Layer 1', tokens: ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ONE'], representativeTokens: getRepresentativeTokens(['ETH', 'SOL', 'ADA']), color: '#E74C3C' },
    { id: 'gaming', name: 'Gaming', tokens: ['SAND', 'MANA', 'AXS', 'ILV', 'ENJ', 'GALA', 'IMX', 'MAGIC', 'APE'], representativeTokens: getRepresentativeTokens(['AXS', 'MANA', 'SAND']), color: '#16A085' },
    { id: 'btc', name: 'Bitcoin', tokens: ['BTC'], representativeTokens: getRepresentativeTokens(['BTC']), color: '#F7931A' }
];


// --- LÓGICA DE DADOS DINÂMICOS ---

let narrativeCache: { data: NarrativeData[], timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface CoinGeckoTokenData {
    id: string;
    symbol: string;
    name: string;
    market_cap: number;
    total_volume: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency: number;
}

/**
 * Busca dados de mercado para uma lista de IDs de tokens da API do CoinGecko.
 */
async function fetchTokenData(tokenIds: string[]): Promise<Map<string, CoinGeckoTokenData>> {
    if (tokenIds.length === 0) return new Map();
    
    const ids = tokenIds.join(',');
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&sparkline=false&price_change_percentage=7d`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch token data from CoinGecko: ${response.statusText}`);
    }

    const data: CoinGeckoTokenData[] = await response.json();
    const tokenDataMap = new Map<string, CoinGeckoTokenData>();
    data.forEach(token => {
        tokenDataMap.set(token.symbol.toUpperCase(), token);
    });
    return tokenDataMap;
}

/**
 * Calcula as métricas agregadas para cada narrativa com base nos dados de mercado em tempo real.
 */
async function calculateDynamicNarratives(): Promise<NarrativeData[]> {
    // Mapeia symbol (e.g., 'FET') para id do coingecko (e.g., 'fetch-ai')
    // Esta é uma simplificação. Uma implementação real precisaria de um mapeamento robusto.
    // Por agora, vamos assumir que o ID do coingecko é o nome completo em minúsculas.
    // Esta é uma grande suposição e pode falhar para muitos tokens.
    const allTokenSymbols = [...new Set(BASE_NARRATIVES.flatMap(n => n.tokens))];
    
    // A API do CoinGecko usa IDs, não símbolos. Precisamos de um mapa.
    // Esta é a parte mais frágil. O ideal seria ter uma lista de IDs do CoinGecko.
    // Vamos criar uma lista de IDs a partir dos nomes (ex: 'Fetch.ai' -> 'fetch-ai')
    // Esta é uma heurística e pode não funcionar sempre.
    const coinIdsResponse = await fetch(`${COINGECKO_API}/coins/list`);
    const coinList: {id: string, symbol: string}[] = await coinIdsResponse.json();
    const symbolToIdMap = new Map<string, string>();
    coinList.forEach(coin => {
        symbolToIdMap.set(coin.symbol.toUpperCase(), coin.id);
    });

    const tokenIdsToFetch = allTokenSymbols
        .map(symbol => symbolToIdMap.get(symbol.toUpperCase()))
        .filter((id): id is string => !!id);

    const tokenDataMap = await fetchTokenData(tokenIdsToFetch);
    const totalMarketCap = Array.from(tokenDataMap.values()).reduce((sum, token) => sum + token.market_cap, 0);

    const dynamicNarratives = BASE_NARRATIVES.map(narrative => {
        let marketCap = 0;
        let volume24h = 0;
        let weightedChange24h = 0;
        let weightedChange7d = 0;
        let totalNarrativeMarketCap = 0;

        narrative.tokens.forEach(symbol => {
            const tokenData = tokenDataMap.get(symbol.toUpperCase());
            if (tokenData) {
                marketCap += tokenData.market_cap;
                volume24h += tokenData.total_volume;
                // Pondera a variação de preço pelo market cap do token
                weightedChange24h += (tokenData.price_change_percentage_24h || 0) * tokenData.market_cap;
                weightedChange7d += (tokenData.price_change_percentage_7d_in_currency || 0) * tokenData.market_cap;
                totalNarrativeMarketCap += tokenData.market_cap;
            }
        });

        const change24h = totalNarrativeMarketCap > 0 ? weightedChange24h / totalNarrativeMarketCap : 0;
        const change7d = totalNarrativeMarketCap > 0 ? weightedChange7d / totalNarrativeMarketCap : 0;
        const dominance = totalMarketCap > 0 ? (marketCap / totalMarketCap) * 100 : 0;

        return {
            ...narrative,
            marketCap,
            volume24h,
            dominance,
            change24h,
            change7d,
        };
    });

    return dynamicNarratives;
}


// --- FUNÇÕES EXPORTADAS ---

/**
 * Retorna os dados das narrativas, buscando novos dados se o cache estiver expirado.
 */
export const getNarratives = async (): Promise<NarrativeData[]> => {
    const now = Date.now();
    if (narrativeCache && (now - narrativeCache.timestamp < CACHE_TTL)) {
        return narrativeCache.data;
    }

    try {
        const data = await calculateDynamicNarratives();
        narrativeCache = { data, timestamp: now };
        return data;
    } catch (error) {
        console.error("Failed to fetch dynamic narrative data, returning cached or empty.", error);
        return narrativeCache?.data || []; // Retorna o cache antigo se a busca falhar
    }
};

/**
 * Retorna uma narrativa específica por ID.
 */
export const getNarrativeById = async (id: string): Promise<NarrativeData | undefined> => {
    const narratives = await getNarratives();
    return narratives.find(narrative => narrative.id === id);
};

/**
 * Calcula os fluxos de capital históricos (últimas 24h) entre as narrativas.
 */
export const calculateHistoricalFlows = (narratives: NarrativeData[]): NarrativeFlow[] => {
    const flows: NarrativeFlow[] = [];
    if (narratives.length === 0) return flows;

    const l1Narrative = narratives.find(n => n.id === 'l1');

    for (const source of narratives) {
        for (const target of narratives) {
            if (source.id === target.id) continue;

            const performanceDiff = target.change24h - source.change24h;

            // Cria um fluxo se a diferença de performance for significativa
            if (performanceDiff > 1.5) { // Limiar de 1.5% de diferença
                const flowMagnitude = (source.marketCap * performanceDiff) / 1000;
                let boostFactor = 1.0;
                if (target.id === 'l1' && l1Narrative && l1Narrative.change24h > 2.0) {
                    boostFactor = 1.5;
                }

                flows.push({
                    from: source.id,
                    to: target.id,
                    value: Math.max(0, flowMagnitude * boostFactor),
                    percentage: performanceDiff,
                    predicted: false
                });
            }
        }
    }
    return flows.sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 fluxos
};

/**
 * Simula predições de fluxos futuros (função mock).
 */
export const predictNarrativeFlows = async (currentNarratives: NarrativeData[]): Promise<ModelPrediction> => {
    try {
        // O modelo de predição agora recebe os dados dinâmicos como entrada
        const predictions = await predictWithModel(currentNarratives);
        return predictions;
    } catch (error) {
        console.error("Error predicting narrative flows:", error);
        // A lógica de fallback permanece a mesma
        const flows: NarrativeFlow[] = [];
        const flowCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < flowCount; i++) {
            const source = currentNarratives[Math.floor(Math.random() * currentNarratives.length)];
            const target = currentNarratives[Math.floor(Math.random() * currentNarratives.length)];
            if (source.id === target.id) continue;

            const basePercentage = (Math.random() * 5) + 0.5;
            const adjustedPercentage = basePercentage * (source.change24h > 0 ? 1.2 : 0.8);
            const flowValue = (source.marketCap * adjustedPercentage) / 100;

            flows.push({
                from: source.id,
                to: target.id,
                value: flowValue,
                percentage: adjustedPercentage,
                predicted: true
            });
        }
        return {
            narrativeFlows: flows,
            timestamp: new Date().toISOString(),
            confidence: 0.75
        };
    }
};

/**
 * Calcula a "pontuação de atenção" do mercado para cada narrativa.
 */
export const getMarketAttentionData = (narratives: NarrativeData[]) => {
    const attentionScores: Record<string, number> = {};
    if (narratives.length === 0) return { attentionScores, topNarratives: [], btcAttention: 0 };

    narratives.forEach(narrative => {
        if (narrative.marketCap > 0) {
            let score = (narrative.volume24h / narrative.marketCap) * (1 + Math.abs(narrative.change24h / 100)) * narrative.dominance;
            if (narrative.id === 'l1') {
                score *= 1.3; // Boost de 30% para L1
            }
            attentionScores[narrative.id] = score;
        }
    });

    const sortedNarratives = [...narratives].sort((a, b) => (attentionScores[b.id] || 0) - (attentionScores[a.id] || 0));
    return {
        attentionScores,
        topNarratives: sortedNarratives.slice(0, 3),
        btcAttention: attentionScores['btc'] || 0
    };
};