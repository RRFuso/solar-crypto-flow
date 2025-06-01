import { CryptoData, FlowData } from "@/types/crypto";

const API_BASE_URL = "https://api.coingecko.com/api/v3";

/**
 * Fetches cryptocurrency data from CoinGecko API
 */
export async function fetchCryptoData(): Promise<CryptoData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=150&sparkline=false&price_change_percentage=1h,24h,7d`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter out coins with missing essential data (price, volume, market cap)
    const filteredData = data.filter((coin: any) => 
      coin.current_price != null && 
      coin.total_volume != null && 
      coin.market_cap != null &&
      coin.symbol != null
    );

    return filteredData.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      performance: coin.price_change_percentage_24h || 0,
      price: coin.current_price.toString(),
      volume: coin.total_volume.toString(),
      marketCap: coin.market_cap,
      high24h: coin.high_24h?.toString() || "0",
      low24h: coin.low_24h?.toString() || "0",
      priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
      priceChange24h: coin.price_change_percentage_24h_in_currency || 0,
      priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
      volumeChange24h: coin.market_cap_change_percentage_24h ?? coin.price_change_percentage_24h ?? 0,
      category: determineCryptoCategory(coin.id),
      // Add raw values needed for flow calculation
      current_price: coin.current_price,
      total_volume: coin.total_volume,
      market_cap: coin.market_cap,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
    }));
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return [];
  }
}

/**
 * Determine crypto category based on id/name (simplified)
 */
function determineCryptoCategory(id: string): string {
  const categories: Record<string, string[]> = {
    'layer1': ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 'near', 'binancecoin', 'ripple', 'tron', 'litecoin', 'cosmos'], // Added more L1s
    'defi': ['uniswap', 'aave', 'maker', 'compound-governance-token', 'curve-dao-token', 'synthetix-network-token', 'pancakeswap-token', 'lido-dao', 'frax-share', 'thorchain', 'rocket-pool', 'sushi'], // Updated DeFi
    'memecoin': ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifhat', 'bonk'],
    'stablecoin': ['tether', 'usd-coin', 'dai', 'true-usd', 'binance-usd', 'frax'],
    'gaming': ['the-sandbox', 'decentraland', 'axie-infinity', 'gala', 'enjincoin', 'immutable-x', 'render-token'], // Updated Gaming
    'privacy': ['monero', 'zcash', 'dash', 'secret', 'oasis-network'],
    'ai': ['fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor', 'render-token', 'the-graph'], // Added AI
    'rwa': ['centrifuge', 'maple', 'ondo-finance', 'pendle'], // Added RWA
    'infrastructure': ['chainlink', 'the-graph', 'filecoin', 'arweave', 'hedera-hashgraph', 'internet-computer'], // Added Infrastructure
    'layer2': ['optimism', 'arbitrum', 'matic-network', 'starknet', 'immutable-x', 'manta-network'] // Added Layer 2
  };

  for (const [category, cryptos] of Object.entries(categories)) {
    if (cryptos.includes(id)) {
      return category;
    }
  }
  // Default categories based on common prefixes/suffixes if not found above
  if (id.includes('wrapped')) return 'other';
  if (id.includes('staked')) return 'defi';
  
  return 'other';
}

/**
 * Generates capital flow data between cryptocurrencies based on market dynamics.
 * This version uses price performance and volume to estimate flows, reducing randomness.
 */
export async function fetchCapitalFlows(cryptos: CryptoData[], maxFlows: number = 50): Promise<FlowData[]> {
  const potentialFlows: FlowData[] = [];
  const minVolumeThreshold = 100000;
  const minMarketCapThreshold = 5000000;

  for (let i = 0; i < cryptos.length; i++) {
    const source = cryptos[i];

    // Skip sources that are stablecoins or below thresholds
    if (source.category === 'stablecoin' || 
        parseFloat(source.volume || '0') < minVolumeThreshold || 
        (source.marketCap || 0) < minMarketCapThreshold) {
      continue;
    }

    for (let j = 0; j < cryptos.length; j++) {
      if (i === j) continue;
      const target = cryptos[j];

      // Skip targets below thresholds (allow stablecoins as targets)
      if (parseFloat(target.volume || '0') < minVolumeThreshold || 
          (target.category !== 'stablecoin' && (target.marketCap || 0) < minMarketCapThreshold)) {
        continue;
      }

      const sourcePerf = source.priceChange24h || 0;
      const targetPerf = target.priceChange24h || 0;
      const perfDiff = targetPerf - sourcePerf;

      // Basic condition: Flow potential exists if there's a performance difference
      if (Math.abs(perfDiff) > 0.5) {
        
        // Calculate flow strength based on performance difference and volumes
        const sourceLogVol = Math.log10(parseFloat(source.volume || '1') + 1);
        const targetLogVol = Math.log10(parseFloat(target.volume || '1') + 1);
        
        // Flow strength increases with performance difference and combined volume
        let flowStrength = Math.abs(perfDiff) * (sourceLogVol + targetLogVol);

        // Adjust strength based on direction
        if (perfDiff > 0 && sourcePerf < 0) {
          flowStrength *= 1.5;
        } else if (perfDiff < 0 && sourcePerf > 0) {
          flowStrength *= 1.2;
        }
        
        // Estimate flow value
        let flowValue = flowStrength * (parseFloat(source.volume || '0') * 0.0005);
        
        // Cap flow value to a max percentage of source market cap
        flowValue = Math.min(flowValue, (source.marketCap || 0) * 0.01);

        const finalFlowValue = perfDiff > 0 ? flowValue : -flowValue;

        // Calculate percentage relative to source market cap
        const percentage = ((source.marketCap || 1) > 0) ? (flowValue / (source.marketCap || 1)) * 100 * (perfDiff > 0 ? 1 : -1) : 0;

        potentialFlows.push({
          id: `${source.symbol}-${target.symbol}-${Date.now()}`,
          from: source.symbol || '',
          to: target.symbol || '',
          value: finalFlowValue,
          percentage: isNaN(percentage) ? 0 : percentage,
          volume: flowValue,
          fromCategory: source.category || 'other',
          toCategory: target.category || 'other'
        });
      }
    }
  }

  // Sort by absolute flow value and return top flows
  return potentialFlows
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, maxFlows);
}

/**
 * Fetches technical indicators (RSI, MACD, etc.) for a cryptocurrency
 * Using a simulation for demo purposes
 */
export async function fetchTechnicalIndicators(
  symbol: string, 
  timeframe: string = '4h'
): Promise<{
  rsi: number;
  rsi4h: number;
  macd: { value: number; signal: number; histogram: number };
  ema12: number;
  ema26: number;
  obv: number;
}> {
  // In a real app, this would call a technical analysis API or calculate from OHLCV data
  // For now, we'll simulate different indicator values based on timeframe
  
  // Add some variation based on timeframe to make the simulation more realistic
  const timeframeMultiplier = getTimeframeMultiplier(timeframe);
  
  return {
    rsi: simulateRSI(timeframeMultiplier),
    rsi4h: simulateRSI(0.9), // 4h RSI is less volatile
    macd: {
      value: simulateMACD(0.5 * timeframeMultiplier),
      signal: simulateMACD(0.4 * timeframeMultiplier),
      histogram: simulateMACD(0.1 * timeframeMultiplier),
    },
    ema12: simulateEMA() * timeframeMultiplier,
    ema26: simulateEMA() * (timeframeMultiplier * 0.9), // EMA26 changes more slowly
    obv: Math.random() * 1000000 - 500000,
  };
}

// Helper function to get a multiplier based on timeframe
function getTimeframeMultiplier(timeframe: string): number {
  switch (timeframe) {
    case '5m':
      return 1.5; // More volatile
    case '15m':
      return 1.3;
    case '30m':
      return 1.2;
    case '1h':
      return 1.1;
    case '4h':
      return 1.0; // Base reference
    case '24h':
      return 0.9;
    case '7d':
      return 0.7; // Less volatile
    default:
      return 1.0;
  }
}

// Helper functions to simulate technical indicators
function simulateRSI(volatilityFactor: number = 1): number {
  // More realistic distribution - cluster around 30-70 range with tails
  const base = Math.random();
  if (base < 0.1) {
    // Low RSI (10-30)
    return (10 + Math.random() * 20) * volatilityFactor;
  } else if (base > 0.9) {
    // High RSI (70-90)
    return (70 + Math.random() * 20) * Math.min(1, volatilityFactor);
  } else {
    // Normal range (30-70)
    return (30 + Math.random() * 40);
  }
}

function simulateMACD(bias: number = 0): number {
  return (Math.random() - 0.5 + bias) * 2;
}

function simulateEMA(): number {
  return Math.random() * 100 + 50;
}

/**
 * Fetches on-chain flow data (simulated)
 */
export async function fetchOnChainData(symbol: string): Promise<{
  exchangeInflow: number;
  exchangeOutflow: number;
  fundingRate: number;
  netFlow: number;
}> {
  // In a real app, this would call an API like CryptoQuant or Glassnode
  const flowBase = Math.random() * 100000;
  const inflow = flowBase + (Math.random() * 20000 - 10000);
  const outflow = flowBase + (Math.random() * 20000 - 10000);
  
  return {
    exchangeInflow: inflow,
    exchangeOutflow: outflow,
    fundingRate: (Math.random() * 0.2 - 0.1), // -0.1% to 0.1%
    netFlow: inflow - outflow
  };
}
