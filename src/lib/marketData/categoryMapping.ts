// Mapeamento de criptomoedas para categorias
export const CRYPTO_CATEGORIES: Record<string, string[]> = {
  'layer1': ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'BNB', 'XRP', 'TRX', 'LTC', 'ATOM'],
  'layer2': ['OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'MANTA'],
  'defi': ['UNI', 'AAVE', 'MKR', 'COMP', 'CRV', 'SNX', 'CAKE', 'LDO', 'FXS', 'RUNE', 'RPL', 'SUSHI'],
  'memecoin': ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'BOME', 'MEME', 'TURBO'],
  'stablecoin': ['USDT', 'USDC', 'DAI', 'TUSD', 'BUSD', 'FRAX'],
  'gaming': ['AXS', 'SAND', 'GALA', 'ENJ', 'MANA', 'IMX', 'BEAM', 'PRIME', 'RONIN'],
  'ai': ['FET', 'AGIX', 'RNDR', 'GRT', 'OCEAN', 'NMR', 'TAO', 'ARKM'],
  'privacy': ['XMR', 'ZEC', 'DASH', 'ZEN', 'SCRT', 'DERO'],
  'solana': ['SOL', 'RAY', 'JTO', 'PYTH', 'JUP', 'ORCA', 'WIF', 'BONK', 'MOBILE'],
  'ethereum': ['ETH', 'OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'ENS', 'LDO'],
  'bitcoin': ['BTC', 'STX', 'ORDI', 'SATS'],
  'bnb': ['BNB', 'CAKE', 'BSW'],
  'rwa': ['ONDO', 'MKR', 'CFG', 'RIO', 'PROPS'],
  'payments': ['XRP', 'XLM', 'BCH', 'LTC', 'DASH'],
  'metaverse': ['MANA', 'SAND', 'AXS', 'ENJ', 'GALA', 'APE'],
  'nft': ['BLUR', 'LOOKS', 'APE', 'ENJ', 'IMX', 'MAGIC'],
  'storage': ['FIL', 'AR', 'STORJ', 'SC'],
  'infrastructure': ['LINK', 'GRT', 'FIL', 'AR', 'HBAR', 'ICP'],
};

/**
 * Determina se um símbolo pertence a uma categoria específica
 */
export const belongsToCategory = (symbol: string, category: string): boolean => {
  if (category === 'all') return true;
  
  const categoryTokens = CRYPTO_CATEGORIES[category];
  if (!categoryTokens) return false;
  
  return categoryTokens.includes(symbol.toUpperCase());
};

/**
 * Retorna todas as categorias às quais um símbolo pertence
 */
export const getCategoriesForSymbol = (symbol: string): string[] => {
  const upperSymbol = symbol.toUpperCase();
  const categories: string[] = [];
  
  for (const [category, tokens] of Object.entries(CRYPTO_CATEGORIES)) {
    if (tokens.includes(upperSymbol)) {
      categories.push(category);
    }
  }
  
  return categories;
};
