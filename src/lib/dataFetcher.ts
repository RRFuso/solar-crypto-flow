
import { CryptoData, FlowData } from "@/types/crypto";

const API_BASE_URL = "https://api.coingecko.com/api/v3";

/**
 * Fetches cryptocurrency data from CoinGecko API
 */
export async function fetchCryptoData(): Promise<CryptoData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=1h,24h,7d`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      performance: coin.price_change_percentage_24h || 0,
      price: coin.current_price.toString(),
      volume: coin.total_volume?.toString() || "0",
      marketCap: coin.market_cap || 0,
      high24h: coin.high_24h?.toString() || "0",
      low24h: coin.low_24h?.toString() || "0",
      priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
      priceChange24h: coin.price_change_percentage_24h_in_currency || 0,
      priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
      volumeChange24h: coin.market_cap_change_percentage_24h || 0,
      category: determineCryptoCategory(coin.id),
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
    'layer1': ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche', 'polkadot', 'near'],
    'defi': ['uniswap', 'aave', 'maker', 'compound', 'curve', 'synthetix', 'pancakeswap', 'lido-dao', 'frax'],
    'memecoin': ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifhat', 'bonk'],
    'stablecoin': ['tether', 'usd-coin', 'dai', 'true-usd', 'binance-usd', 'frax'],
    'gaming': ['the-sandbox', 'decentraland', 'axie-infinity', 'gala', 'enjincoin', 'immutable'],
    'privacy': ['monero', 'zcash', 'dash', 'secret', 'oasis-network'],
    'ai': ['fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor', 'render-token']
  };

  for (const [category, cryptos] of Object.entries(categories)) {
    if (cryptos.includes(id)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Simulates or fetches capital flow data between cryptocurrencies
 */
export async function fetchCapitalFlows(cryptos: CryptoData[]): Promise<FlowData[]> {
  // First get real price and volume data
  const cryptoMap = new Map(cryptos.map(crypto => [crypto.symbol, crypto]));
  
  // Generate simulated flows based on price changes and volumes
  const flows: FlowData[] = [];

  for (const source of cryptos) {
    // Skip stablecoins as sources for outflows
    if (source.category === 'stablecoin') continue;
    
    // Generate 1-3 outgoing flows from this crypto
    const flowCount = source.performance < 0 
      ? Math.floor(Math.random() * 3) + 1  // More flows if negative performance
      : Math.floor(Math.random() * 2) + 1; 
      
    const targets = cryptos
      .filter(c => c.symbol !== source.symbol)
      .sort(() => Math.random() - 0.5)
      .slice(0, flowCount);
    
    for (const target of targets) {
      // Create more realistic flow values based on price movement and volume
      const sourceVolume = parseFloat(source.volume || "0");
      const sourcePerf = source.performance || 0;
      const targetPerf = target.performance || 0;
      
      // Calculate flow value - higher if source is dropping and target is rising
      let flowValue = Math.abs(sourcePerf - targetPerf) * sourceVolume * 0.00001;
      
      // Cap the flow value for visualization purposes
      flowValue = Math.min(flowValue, sourceVolume * 0.05);
      
      // Determine if this represents inflow or outflow
      const isOutflow = sourcePerf < 0 && targetPerf > sourcePerf;
      
      // Calculate percentage (proportion relative to source market cap)
      const percentage = (flowValue / sourceVolume) * 100 * (isOutflow ? -1 : 1);
      
      flows.push({
        from: source.symbol,
        to: target.symbol,
        value: isOutflow ? -flowValue : flowValue,
        percentage: percentage,
        volume: flowValue,
        fromCategory: source.category || 'other',
        toCategory: target.category || 'other'
      });
    }
  }
  
  // Sort by absolute flow value and return top flows
  return flows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

/**
 * Fetches technical indicators (RSI, MACD, etc.) for a cryptocurrency
 * Using a simulation for demo purposes
 */
export async function fetchTechnicalIndicators(symbol: string): Promise<{
  rsi: number;
  rsi4h: number;
  macd: { value: number; signal: number; histogram: number };
  ema12: number;
  ema26: number;
  obv: number;
}> {
  // In a real app, this would call a technical analysis API or calculate from OHLCV data
  return {
    rsi: simulateRSI(),
    rsi4h: simulateRSI(),
    macd: {
      value: simulateMACD(0.5),
      signal: simulateMACD(0.4),
      histogram: simulateMACD(0.1),
    },
    ema12: simulateEMA(),
    ema26: simulateEMA(),
    obv: Math.random() * 1000000 - 500000,
  };
}

// Helper functions to simulate technical indicators
function simulateRSI(): number {
  return Math.floor(Math.random() * 100);
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
