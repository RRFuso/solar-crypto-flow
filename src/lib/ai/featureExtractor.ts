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
      // If any of these are missing we fall back to simulate*() derived from
      // price/volume, which is a circular signal (feature ≈ target) and MUST
      // be marked as simulated so downstream engines can down-weight it.
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

        // On-chain metrics — prefer real, fall back to simulate*() explicitly
        activeAddresses: realActive ?? this.simulateActiveAddresses(crypto),
        newWallets: realNew ?? this.simulateNewWallets(crypto),
        whaleMovements: realWhale ?? this.simulateWhaleMovements(crypto),
        dormantWakeups: realDormant ?? this.simulateDormantWakeups(crypto),
        exchangeInflow: realInflow ?? this.simulateExchangeInflow(crypto),
        exchangeOutflow: realOutflow ?? this.simulateExchangeOutflow(crypto),

        // Social sentiment (still simulated — no real source integrated yet)
        socialScore: social?.sentiment ?? this.calculateSocialScore(crypto),
        mentionVolume: social?.mentionVolume ?? this.simulateMentionVolume(crypto),
        sentimentCluster: this.determineSentimentCluster(social?.sentiment || 0),

        // Market data
        volume24h: this.normalizeVolume(parseFloat(String(crypto.volume || '0'))),
        priceChange24h: parseFloat(String(crypto.priceChangePercent || '0')),
        // TODO: liquidityDepth and orderBookImbalance have NO real source in
        // this project — currently estimated from volume/market-cap/price.
        // Replace with real order-book snapshots when a source is integrated.
        liquidityDepth: this.calculateLiquidityDepth(crypto),
        orderBookImbalance: this.calculateOrderBookImbalance(crypto),

        // Technical indicators
        rsi: crypto.rsi4h || this.calculateRSI(crypto),
        macd: this.calculateMACD(crypto),
        bollingerPosition: this.calculateBollingerPosition(crypto),
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

  private simulateActiveAddresses(crypto: CryptoData): number {
    // Simulate based on market cap and volume
    const baseAddresses = Math.log(parseFloat(String(crypto.marketCap || '1000000'))) * 100;
    const volumeMultiplier = Math.min(parseFloat(String(crypto.volume || '0')) / 1000000, 5);
    return Math.floor(baseAddresses * (1 + volumeMultiplier * 0.2));
  }

  private simulateNewWallets(crypto: CryptoData): number {
    // More new wallets during high volume periods
    const volume = parseFloat(String(crypto.volume || '0'));
    const baseNewWallets = Math.min(volume / 100000, 200);
    const random = Math.random() * 0.5 + 0.75; // 0.75-1.25 multiplier
    return Math.floor(baseNewWallets * random);
  }

  private simulateWhaleMovements(crypto: CryptoData): number {
    // Whale movements correlate with volume and price changes
    const volume = parseFloat(String(crypto.volume || '0'));
    const priceChange = Math.abs(parseFloat(String(crypto.priceChangePercent || '0')));
    
    const baseMovements = Math.min(volume / 10000000, 20);
    const volatilityMultiplier = Math.min(priceChange / 5, 2);
    return Math.floor(baseMovements * (1 + volatilityMultiplier));
  }

  private simulateDormantWakeups(crypto: CryptoData): number {
    // Dormant wallets wake up during significant market events
    const priceChange = Math.abs(parseFloat(String(crypto.priceChangePercent || '0')));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    if (priceChange > 10 || volume > 50000000) {
      return Math.floor(Math.random() * 10) + 1;
    }
    return Math.floor(Math.random() * 3);
  }

  private simulateExchangeInflow(crypto: CryptoData): number {
    // Higher inflow during selling pressure
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    const baseInflow = volume * 0.1;
    const sellPressure = priceChange < 0 ? Math.abs(priceChange) / 10 : 0;
    return baseInflow * (1 + sellPressure);
  }

  private simulateExchangeOutflow(crypto: CryptoData): number {
    // Higher outflow during accumulation
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    const baseOutflow = volume * 0.08;
    const accumulation = priceChange > 0 ? priceChange / 10 : 0;
    return baseOutflow * (1 + accumulation);
  }

  private calculateSocialScore(crypto: CryptoData): number {
    // Simulate social sentiment based on price action and volume
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    let sentiment = priceChange / 20; // Base sentiment from price
    if (volume > 10000000) sentiment += 0.1; // High volume boost
    if (priceChange > 5) sentiment += 0.2; // Strong gains boost
    
    return Math.max(-1, Math.min(1, sentiment));
  }

  private simulateMentionVolume(crypto: CryptoData): number {
    // Higher mentions for high volume, high market cap cryptos
    const volume = parseFloat(String(crypto.volume || '0'));
    const marketCap = parseFloat(String(crypto.marketCap || '0'));
    
    const baseMentions = Math.log(marketCap || 1000000) * 10;
    const volumeBoost = Math.min(volume / 1000000, 10);
    return Math.floor(baseMentions * (1 + volumeBoost * 0.1));
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

  private calculateLiquidityDepth(crypto: CryptoData): number {
    // Estimate liquidity depth from volume and market cap
    const volume = parseFloat(String(crypto.volume || '0'));
    const marketCap = parseFloat(String(crypto.marketCap || '1'));
    return (volume / marketCap) * 100; // Volume as % of market cap
  }

  private calculateOrderBookImbalance(crypto: CryptoData): number {
    // Simulate order book imbalance
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    // More buying pressure during uptrends with high volume
    let imbalance = 0.5; // Neutral
    if (priceChange > 0 && volume > 5000000) imbalance += 0.2;
    if (priceChange < 0 && volume > 5000000) imbalance -= 0.2;
    
    return Math.max(0, Math.min(1, imbalance));
  }

  private calculateRSI(crypto: CryptoData): number {
    // Use existing RSI or estimate from price change
    if (crypto.rsi4h) return crypto.rsi4h;
    
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const baseRSI = 50;
    const adjustment = priceChange * 1.5;
    return Math.max(0, Math.min(100, baseRSI + adjustment));
  }

  private calculateMACD(crypto: CryptoData): number {
    // Simulate MACD based on price momentum
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    const volume = parseFloat(String(crypto.volume || '0'));
    
    let macd = priceChange / 10; // Base MACD from price change
    if (volume > 10000000) macd *= 1.2; // Volume confirmation
    
    return macd;
  }

  private calculateBollingerPosition(crypto: CryptoData): number {
    // Position within Bollinger Bands (0 = lower band, 1 = upper band)
    const priceChange = parseFloat(String(crypto.priceChangePercent || '0'));
    
    // Estimate position based on recent performance
    let position = 0.5; // Middle
    if (priceChange > 5) position = 0.8; // Near upper band
    if (priceChange > 10) position = 0.95; // Above upper band
    if (priceChange < -5) position = 0.2; // Near lower band
    if (priceChange < -10) position = 0.05; // Below lower band
    
    return position;
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