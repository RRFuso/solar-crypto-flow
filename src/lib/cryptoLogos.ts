// Mapping of crypto symbols to their CoinMarketCap IDs for the primary source
const symbolToIdMap: Record<string, number> = {
  'BTC': 1, 'ETH': 1027, 'SOL': 5426, 'BNB': 1839, 'XRP': 52, 'ADA': 2010,
  'AVAX': 5805, 'DOT': 6636, 'DOGE': 74, 'MATIC': 3890, 'LINK': 1975,
  'UNI': 7083, 'SHIB': 5994, 'TRX': 1958, 'TON': 11419, 'ICP': 8916,
  'NEAR': 6535, 'APT': 21794, 'ARB': 11841, 'OP': 11840, 'FIL': 2280,
  'SUI': 20947, 'ALGO': 4030, 'ATOM': 3794, 'MANA': 1966, 'SEI': 20947,
  'GRT': 6719, 'AAVE': 7278, 'MKR': 1518, 'CRV': 6538, 'COMP': 5692,
  'SNX': 2586, 'LDO': 8000, 'RUNE': 4157, 'FXS': 6953, 'PENDLE': 8409,
  'JUP': 25147, 'INJ': 7226, 'ARKM': 25508, 'BLUR': 23121, 'TIA': 28869,
  'STX': 4847, 'IMX': 10603, 'WIF': 27867, 'ORDI': 27889, 'PEPE': 24478,
  'BONK': 27855, 'FLOKI': 9023, 'KAS': 21566, 'GALA': 12493, 'SAND': 6210,
  'AXS': 6783, 'APE': 18876, 'DYDX': 11156, 'GMT': 18069, 'FET': 3773,
  'AGIX': 2424, 'OCEAN': 3911, 'RENDER': 7129,
};

/**
 * Generates a fallback SVG image as a Data URI.
 * This creates a neutral placeholder with the crypto's symbol,
 * which is much better than defaulting to a wrong logo like Bitcoin's.
 * @param symbol The crypto symbol to display (e.g., "XYZ").
 * @returns A string containing a base64-encoded SVG Data URI.
 */
const generateFallbackSvg = (symbol: string): string => {
  const symbolText = symbol.toUpperCase().substring(0, 4);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <circle cx="32" cy="32" r="30" fill="#475569" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="white"
        font-size="20"
        font-family="sans-serif"
        font-weight="bold">
        ${symbolText}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Returns a prioritized list of logo URLs to attempt loading.
 * This creates a robust fallback chain.
 * @param symbol The crypto symbol (e.g., "BTC").
 * @returns An array of URL strings.
 */
export const getLogoUrls = (symbol: string): string[] => {
  const normalizedSymbol = symbol.toUpperCase();
  const coinId = symbolToIdMap[normalizedSymbol];

  const urls: string[] = [];

  // 1. Primary Source: CoinMarketCap (high quality, if ID is known)
  if (coinId) {
    urls.push(`https://s2.coinmarketcap.com/static/img/coins/64x64/${coinId}.png`);
  }

  // 2. Secondary Source: TradingView (good for major symbols)
  urls.push(`https://s3-symbol-logo.tradingview.com/crypto/XTVC${normalizedSymbol}.svg`);
  
  // 3. Tertiary Source: CryptoCompare
  urls.push(`https://www.cryptocompare.com/media/37746238/${normalizedSymbol}.png`);

  // 4. Final Fallback: A dynamically generated SVG placeholder
  urls.push(generateFallbackSvg(normalizedSymbol));

  return urls;
};

// --- Deprecated functions below can be removed later ---

export const getCryptoLogoUrl = (symbol: string): string => {
  const id = symbolToIdMap[symbol.toUpperCase()] || 1; // Default to BTC
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
};

export const getFallbackLogoUrl = (): string => {
  return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#F7931A"/><path fill="white" d="M... a very long path for bitcoin logo ..."/></svg>')}`;
};