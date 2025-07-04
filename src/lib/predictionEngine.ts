
export interface PredictionInput {
  symbol: string;
  volatilityCompression: number; // 0 to 1 (1 is high compression)
  volumeSpike: number; // 0 to 1 (1 is a significant spike)
}

export interface ExplosiveSignal {
  symbol: string;
  explosivePotential: 'high' | 'medium' | 'low';
  predictionDirection: 'up' | 'down' | 'neutral';
  predictionConfidence: number; // 0 to 1
  description: string;
}

/**
 * Generates an explosive signal based on a set of heuristic rules.
 * @param input - The features calculated for a specific crypto.
 * @returns An ExplosiveSignal if rules are met, otherwise null.
 */
export const generateSignal = (input: PredictionInput): ExplosiveSignal | null => {
  const { volatilityCompression, volumeSpike, symbol } = input;

  // Rule for High Potential Explosive UP Move
  // Requires very high compression and a strong volume spike, indicating a potential breakout.
  if (volatilityCompression > 0.85 && volumeSpike > 0.75) {
    const confidence = (volatilityCompression + volumeSpike) / 2;
    return {
      symbol,
      explosivePotential: 'high',
      predictionDirection: 'up',
      predictionConfidence: confidence,
      description: `Price is in a very tight consolidation with a significant volume spike. High potential for an upward breakout.`
    };
  }

  // Rule for Medium Potential Explosive UP Move
  // Requires good compression and some volume increase.
  if (volatilityCompression > 0.7 && volumeSpike > 0.5) {
    const confidence = (volatilityCompression + volumeSpike) / 2;
    return {
      symbol,
      explosivePotential: 'medium',
      predictionDirection: 'up',
      predictionConfidence: confidence,
      description: `Price is consolidating with increasing volume. Medium potential for an upward move.`
    };
  }
  
  // Add rules for bearish signals later if needed.
  // e.g., breakdown from consolidation with high volume.

  return null;
};
