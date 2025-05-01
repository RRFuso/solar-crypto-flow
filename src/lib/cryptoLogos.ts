
// Mapping of crypto symbols to their CoinMarketCap IDs
export const symbolToIdMap: Record<string, number> = {
  'BTC': 1,
  'ETH': 1027,
  'SOL': 5426,
  'BNB': 1839,
  'XRP': 52,
  'ADA': 2010,
  'AVAX': 5805,
  'DOT': 6636,
  'DOGE': 74,
  'MATIC': 3890,
  'LINK': 1975,
  'UNI': 7083,
  'SHIB': 5994,
  'TRX': 1958,
  'TON': 11419,
  'ICP': 8916,
  'NEAR': 6535,
  'APT': 21794,
  'ARB': 11841,
  'OP': 11840,
  'FIL': 2280,
  'SUI': 20947,
  'ALGO': 4030,
  'ATOM': 3794,
  'MANA': 1966,
  'SEI': 20947,
  'GRT': 6719,
  'AAVE': 7278,
  'MKR': 1518,
  'CRV': 6538,
  'COMP': 5692,
  'SNX': 2586,
  'LDO': 8000,
  'RUNE': 4157,
  'FXS': 6953,
  'PENDLE': 8409,
  'JUP': 25147,
  'INJ': 7226,
  'ARKM': 25508,
  'BLUR': 23121,
  'TIA': 28869,
  'STX': 4847,
  'IMX': 10603,
  'WIF': 27867,
  'ORDI': 27889,
  // Additional popular cryptos
  'PEPE': 24478,
  'BONK': 27855,
  'FLOKI': 9023,
  'KAS': 21566,
  'GALA': 12493,
  'SAND': 6210,
  'AXS': 6783,
  'APE': 18876,
  'DYDX': 11156,
  'GMT': 18069,
  'FET': 3773,
  'AGIX': 2424,
  'OCEAN': 3911,
  'RENDER': 7129,
};

export const getCoinIdForSymbol = (symbol: string): number => {
  return symbolToIdMap[symbol] || 1; // Default to BTC if not found
};

export const getCryptoLogoUrl = (symbol: string): string => {
  const id = getCoinIdForSymbol(symbol);
  
  // Try CoinMarketCap first
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
};

export const getFallbackLogoUrl = (): string => {
  return 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
};

/**
 * Multi-source logo service with fallbacks
 */
export const getReliableCryptoLogoUrl = (symbol: string): string[] => {
  const normalizedSymbol = symbol.toUpperCase();
  
  return [
    // CoinMarketCap (highest quality, requires ID mapping)
    getCryptoLogoUrl(normalizedSymbol),
    
    // TradingView Symbol Service (fairly reliable)
    `https://s3-symbol-logo.tradingview.com/crypto/XTVC${normalizedSymbol}.svg`,
    
    // CryptoCompare (another reliable source)
    `https://www.cryptocompare.com/media/37746238/${normalizedSymbol}.png`,
    
    // CryptoIcon API (Vercel-hosted service)
    `https://cryptoicon-api.vercel.app/api/icon/${normalizedSymbol.toLowerCase()}`,
    
    // Generic fallback
    getFallbackLogoUrl()
  ];
};
