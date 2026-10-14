import { CryptoData } from '@/types/crypto';
import { OnChainMetrics } from '@/types/onchain';
import { SocialMetrics } from '@/types/social';
import { ExplosiveFeatures } from './explosiveSignalEngine';

export class AdvancedFeatureExtractor {
  // Extract comprehensive features for explosive signal detection
  public extractExplosiveFeatures(
    cryptoData: CryptoData[],
    onChainData: OnChainMetrics[] = [],
    socialData: SocialMetrics[] = []
  ): ExplosiveFeatures[] {
    const features: ExplosiveFeatures[] = [];
    
    for (const crypto of cryptoData) {
      const onChain = onChainData.find(oc => oc.symbol === crypto.symbol);
      const social = socialData.find(s => s.symbol === crypto.symbol);

      // Real on-chain fields — only used when actually present on the payload.
      // Missing fields stay NaN (sem dados) — never derived from price/volume.
      const realWhale = onChain?.whaleMovements;
      const realInflow = onChain?.exchangeFlow?.inflow;
      const realOutflow = onChain?.exchangeFlow?.outflow;
      const realActive = onChain?.activeAddresses;
      const realNew = onChain?.newWallets;
      const realDormant = onChain?.dormantWakeups;

      const realFields = [realWhale, realInflow, realOutflow, realActive, realNew, realDormant];
      const realCount = realFields.filter(v => v !== undefined).length;
      const onChainRealFieldsRatio = realCount / realFields.length;
      const hasAnyRealOnChain = realCount > 0;

      // Social is currently always simulated (no real source integrated).
      const socialIsSimulated = !social;
      // Market microstructure is always estimated from price/volume today.
      const marketIsSimulated = true;

      const feature: ExplosiveFeatures = {
        symbol: crypto.symbol,
        timestamp: Date.now(),

        // On-chain metrics — only real values. NaN = sem dados: every
        // comparison with NaN is false, so the engines exclude the factor.
        activeAddresses: realActive ?? NaN,
        newWallets: realNew ?? NaN,
        whaleMovements: realWhale ?? NaN,
        dormantWakeups: realDormant ?? NaN,
        exchangeInflow: realInflow ?? NaN,
        exchangeOutflow: realOutflow ?? NaN,

        // Social sentiment — no real source integrated: sem dados.
        socialScore: social?.sentiment ?? NaN,
        mentionVolume: social?.mentionVolume ?? NaN,
        sentimentCluster: social ? this.determineSentimentCluster(social.sentiment) : 'neutral',

        // Market data
        volume24h: this.normalizeVolume(parseFloat(String(crypto.volume || '0'))),
        priceChange24h: parseFloat(String(crypto.priceChangePercent || '0')),
        // No order-book source is integrated. 24h volume / market cap is NOT
        // order-book depth, so these stay "sem dados" until real snapshots exist.
        liquidityDepth: NaN,
        orderBookImbalance: NaN,

        // Technical indicators — only real candle-derived RSI; MACD/Bollinger
        // need price history that this payload does not carry.
        rsi: typeof crypto.rsi4h === 'number' && Number.isFinite(crypto.rsi4h) ? crypto.rsi4h : NaN,
        macd: NaN,
        bollingerPosition: NaN,
        // 24h volume relative to 1% of market cap (turnover ratio).
        volumeProfile: this.calculateVolumeProfile(crypto),

        // Provenance flags
        isSimulated: !hasAnyRealOnChain,
        onChainRealFieldsRatio,
        socialIsSimulated,
        marketIsSimulated,
      };

      features.push(feature);
    }

    
    return features;
  }

  private determineSentimentCluster(sentiment: number): 'bullish' | 'bearish' | 'neutral' {
    if (sentiment > 0.3) return 'bullish';
    if (sentiment < -0.3) return 'bearish';
    return 'neutral';
  }

  private normalizeVolume(volume: number): number {
    // Normalize volume relative to typical crypto volumes
    const typicalVolume = 1000000; // $1M as baseline
    return volume / typicalVolume;
  }

  private calculateVolumeProfile(crypto: CryptoData): number {
    // Volume relative to typical volume
    const volume = parseFloat(String(crypto.volume || '0'));
    const marketCap = parseFloat(String(crypto.marketCap || '1'));
    
    // Typical volume should be ~1% of market cap daily
    const typicalVolume = marketCap * 0.01;
    return volume / typicalVolume;
  }
}

export const advancedFeatureExtractor = new AdvancedFeatureExtractor();