import { CryptoData } from "@/types/crypto";
import { NarrativeData } from "@/types/narratives";

// --- Constants for Price Action Detection ---
const VOLUME_AVG_PERIOD = 7; // Days to calculate average volume
const VOLATILITY_COMPRESSION_PERIOD = 5; // Days to check for low volatility
const VOLATILITY_THRESHOLD_LOW = 1.5; // Max % change during compression
const VOLATILITY_EXPANSION_FACTOR = 3; // How much bigger the expansion move needs to be
const MOMENTUM_ACCELERATION_THRESHOLD = 1.5; // Factor increase between 1h/24h/7d changes

// --- Interfaces for Historical Data (Assumed Structure) ---
interface DailySnapshot extends Omit<CryptoData, 'id' | 'name' | 'symbol' | 'category'> {
  date: string; // YYYY-MM-DD
}

// --- Price Action Detection Logic ---

/**
 * Calculates Simple Moving Average of Volume over a period.
 * Assumes historicalData is sorted chronologically, newest first.
 */
function calculateVolumeSMA(historicalData: DailySnapshot[], period: number): number {
  if (historicalData.length < period) return 0;
  const relevantData = historicalData.slice(0, period);
  const totalVolume = relevantData.reduce((sum, day) => sum + parseFloat(day.volume || '0'), 0);
  return totalVolume / period;
}

/**
 * Detects a potential Price/Volume Breakout.
 * Checks if current price exceeds recent high with volume above average.
 */
function detectPriceVolumeBreakout(currentData: CryptoData, historicalData: DailySnapshot[]): boolean {
  if (!currentData.high24h || historicalData.length < VOLUME_AVG_PERIOD) return false;

  const currentPrice = parseFloat(currentData.price);
  const high24h = parseFloat(currentData.high24h);
  const currentVolume = parseFloat(currentData.volume || '0');
  const avgVolume = calculateVolumeSMA(historicalData, VOLUME_AVG_PERIOD);

  // Condition: Price breaks 24h high AND current volume is significantly above average (e.g., > 1.5x)
  return currentPrice > high24h && avgVolume > 0 && currentVolume > avgVolume * 1.5;
}

/**
 * Detects Volatility Compression followed by Expansion.
 * Checks for a period of low daily changes followed by a large move.
 */
function detectVolatilityExpansion(currentData: CryptoData, historicalData: DailySnapshot[]): boolean {
  if (historicalData.length < VOLATILITY_COMPRESSION_PERIOD) return false;

  const recentHistory = historicalData.slice(0, VOLATILITY_COMPRESSION_PERIOD);
  const isCompressed = recentHistory.every(
    day => Math.abs(day.priceChange24h || 0) < VOLATILITY_THRESHOLD_LOW
  );

  if (!isCompressed) return false;

  // Check if the *current* move (represented by currentData.priceChange24h)
  // is significantly larger than the compression threshold.
  const currentChange = Math.abs(currentData.priceChange24h || 0);
  return currentChange > VOLATILITY_THRESHOLD_LOW * VOLATILITY_EXPANSION_FACTOR;
}

/**
 * Detects Acceleration of Momentum.
 * Checks if shorter-term price changes are significantly larger than longer-term ones.
 */
function detectMomentumAcceleration(currentData: CryptoData): boolean {
  const change1h = Math.abs(currentData.priceChange1h || 0);
  const change24h = Math.abs(currentData.priceChange24h || 0);
  const change7d = Math.abs(currentData.priceChange7d || 0);

  // Avoid division by zero or near-zero; require some baseline movement
  if (change24h < 0.1 || change7d < 0.1) return false;

  // Check if 1h > 24h and 24h > 7d by a significant factor
  const accel24hVs7d = change24h > change7d * MOMENTUM_ACCELERATION_THRESHOLD;
  // Optional: Check 1h vs 24h acceleration (can be noisy)
  // const accel1hVs24h = change1h > change24h * MOMENTUM_ACCELERATION_THRESHOLD;

  return accel24hVs7d; // Focus on 24h vs 7d acceleration for stability
}

// --- Main AI Model Function (Conceptual Integration) ---

/**
 * Analyzes crypto data to generate insights, including price action signals.
 * Assumes access to historical data for each crypto.
 *
 * NOTE: This is a conceptual integration. The actual fetching and passing
 * of historicalData needs to be implemented (e.g., via Supabase).
 */
export async function analyzeCryptoWithPriceAction(
  cryptoList: CryptoData[],
  // This historical data map would need to be populated from Supabase
  historicalDataMap: Map<string, DailySnapshot[]>
): Promise<any[]> { // Return type should be defined based on desired output

  const analysisResults = cryptoList.map(crypto => {
    const historical = historicalDataMap.get(crypto.symbol) || [];

    const isBreakout = detectPriceVolumeBreakout(crypto, historical);
    const isExpansion = detectVolatilityExpansion(crypto, historical);
    const isAccelerating = detectMomentumAcceleration(crypto);

    let explosiveSignal = 'None';
    if (isBreakout && isAccelerating) {
      explosiveSignal = 'High (Breakout + Momentum)';
    } else if (isExpansion && isAccelerating) {
      explosiveSignal = 'High (Expansion + Momentum)';
    } else if (isBreakout || isExpansion) {
      explosiveSignal = 'Medium (Breakout/Expansion)';
    } else if (isAccelerating) {
      explosiveSignal = 'Low (Momentum Acceleration)';
    }

    return {
      symbol: crypto.symbol,
      name: crypto.name,
      currentPrice: crypto.price,
      priceChange24h: crypto.priceChange24h,
      volume: crypto.volume,
      marketCap: crypto.marketCap,
      // Add the new signal
      explosivePotential: explosiveSignal,
      // Include flags for debugging/detail
      flags: {
        isBreakout,
        isExpansion,
        isAccelerating
      }
      // ... other existing analysis results
    };
  });

  return analysisResults;
}

// --- Placeholder for Narrative Model (if separate) ---
export async function predictNarrativeShift(narratives: NarrativeData[]): Promise<any> {
  // Placeholder for existing narrative prediction logic
  console.log("Predicting narrative shifts for:", narratives.length);
  return { message: "Narrative prediction placeholder" };
}

