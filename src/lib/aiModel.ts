import { normalizeFeatures } from './featureExtractor';

const predictionCache = new Map();
const CACHE_TTL = 1000 * 60 * 15;

export function getCachedPrediction(symbol) {
    const cached = predictionCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.prediction;
    }
    return null;
}

export function storePrediction(prediction) {
    predictionCache.set(prediction.symbol, {
        prediction,
        timestamp: Date.now()
    });
}

export function predictPriceMovements(features, chartTimeframe = "4h") {
    const normalized = normalizeFeatures(features);
    const weights = getTimeframeWeights(chartTimeframe);
    const predictions = [];

    for (const feat of normalized) {
        const bull = scoreBullish(feat, weights);
        const bear = scoreBearish(feat, weights);
        const isBullish = bull > bear;
        const conf = isBullish ? bull / (bull + bear) : bear / (bull + bear);
        const factors = getFactors(feat, isBullish, chartTimeframe);

        predictions.push({
            symbol: feat.symbol,
            name: feat.id,
            bullish: isBullish,
            confidence: Math.min(0.95, conf),
            factors,
            timestamp: Date.now(),
            price: feat.price
        });
    }

    return predictions;
}

function getTimeframeWeights(timeframe) {
    switch (timeframe) {
        case "5m": return { tech: 1.5, fund: 0.3, flow: 1.2, mom: 1.6 };
        case "15m": return { tech: 1.4, fund: 0.4, flow: 1.1, mom: 1.4 };
        case "1h": return { tech: 1.2, fund: 0.6, flow: 1.0, mom: 1.1 };
        case "4h": return { tech: 1.0, fund: 0.8, flow: 1.0, mom: 1.0 };
        case "24h": return { tech: 0.9, fund: 1.0, flow: 1.0, mom: 0.9 };
        default: return { tech: 1.0, fund: 1.0, flow: 1.0, mom: 1.0 };
    }
}

function scoreBullish(f, w) {
    let s = 0;
    if (f.rsi < 30) s += 2 * w.tech;
    if (f.rsi4h < 40 && f.rsi4h > 30) s += 1.5 * w.tech;
    if (f.macd > f.macdSignal) s += 1.5 * w.tech;
    if (f.macdHistogram > 0) s += 1 * w.tech;
    if (f.aboveMA) s += 1 * w.tech;

    if (f.divergenceBullish) s += 2.5 * w.tech;
    if (f.lateralizationScore > 0.7 && f.volumeChange24h > 15) s += 1.5 * w.tech;

    if (f.priceChange1h > 1) s += 2 * w.mom;
    if (f.priceChange24h > 5) s += 1 * w.fund;
    if (f.volumeChange24h > 20) s += 1.5 * w.mom;
    if (f.obv > 0) s += 1 * w.mom;
    if (f.netFlowPercentage > 0) s += 1.5 * w.flow;
    if (f.incomingFlows > f.outgoingFlows) s += 1 * w.flow;
    if (f.exchangeOutflow > f.exchangeInflow) s += 1 * w.flow;
    return s;
}

function scoreBearish(f, w) {
    let s = 0;
    if (f.rsi > 70) s += 2 * w.tech;
    if (f.rsi4h > 70) s += 1.5 * w.tech;
    if (f.macd < f.macdSignal) s += 1.5 * w.tech;
    if (f.macdHistogram < 0) s += 1 * w.tech;
    if (!f.aboveMA) s += 1 * w.tech;

    if (f.divergenceBearish) s += 2.5 * w.tech;
    if (f.lateralizationScore > 0.7 && f.volumeChange24h > 15) s += 2 * w.tech;

    if (f.priceChange1h < -1) s += 2 * w.mom;
    if (f.priceChange24h < -5) s += 1 * w.fund;
    if (f.volumeChange24h > 20 && f.priceChange24h < 0) s += 2 * w.mom;
    if (f.obv < 0) s += 1 * w.mom;
    if (f.netFlowPercentage < 0) s += 1.5 * w.flow;
    if (f.outgoingFlows > f.incomingFlows) s += 1 * w.flow;
    if (f.exchangeInflow > f.exchangeOutflow) s += 1 * w.flow;
    return s;
}

function getFactors(f, bull, tf) {
    const list = [];

    if (bull) {
        if (f.rsi < 30) list.push("RSI oversold");
        if (f.macd > f.macdSignal) list.push("MACD bullish crossover");
        if (f.macdHistogram > 0) list.push("MACD histogram positivo");
        if (f.divergenceBullish) list.push("Bullish divergence confirmada");
        if (f.volumeChange24h > 20) list.push("Volume alto");
        if (f.netFlowPercentage > 1) list.push("Forte fluxo positivo");
    } else {
        if (f.rsi > 70) list.push("RSI overbought");
        if (f.macd < f.macdSignal) list.push("MACD bearish crossover");
        if (f.macdHistogram < 0) list.push("MACD histogram negativo");
        if (f.divergenceBearish) list.push("Bearish divergence detectada");
        if (f.volumeChange24h > 20 && f.priceChange24h < 0) list.push("Venda com volume alto");
        if (f.netFlowPercentage < -1) list.push("Forte fluxo negativo");
    }

    if (list.length > 0) list[0] += ` (${tf})`;
    return list.slice(0, 3);
}
