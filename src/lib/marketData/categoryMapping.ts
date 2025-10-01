// Mapeamento de criptomoedas para categorias
export const CRYPTO_CATEGORIES: Record<string, string[]> = {
  'layer1': ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'BNB', 'XRP', 'TRX', 'LTC', 'ATOM', 'ALGO', 'XTZ', 'FTM', 'EOS', 'VET', 'HBAR', 'EGLD', 'FLOW', 'ICP', 'KAS', 'INJ', 'SUI', 'SEI'],
  'layer2': ['OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'MANTA', 'METIS', 'SKL', 'BOBA', 'OMG', 'ZKS', 'CELO', 'POLYGON'],
  'defi': ['UNI', 'AAVE', 'MKR', 'COMP', 'CRV', 'SNX', 'CAKE', 'LDO', 'FXS', 'RUNE', 'RPL', 'SUSHI', 'YFI', 'ZRX', '1INCH', 'BAL', 'GMX', 'PENDLE', 'JOE', 'DYDX'],
  'memecoin': ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'BOME', 'MEME', 'TURBO', 'COQ', 'MYRO', 'MOG', 'PEPECOIN'],
  'stablecoin': ['USDT', 'USDC', 'DAI', 'TUSD', 'BUSD', 'FRAX', 'USDP', 'GUSD', 'PAXG'],
  'gaming': ['AXS', 'SAND', 'GALA', 'ENJ', 'MANA', 'IMX', 'BEAM', 'PRIME', 'RONIN', 'ILV', 'YGG', 'PYR', 'UOS', 'ALICE', 'NAKA'],
  'ai': ['FET', 'AGIX', 'RNDR', 'GRT', 'OCEAN', 'NMR', 'TAO', 'ARKM', 'WLD', 'AKT', 'PAAL', 'AIOZ', 'ORAI'],
  'privacy': ['XMR', 'ZEC', 'DASH', 'ZEN', 'SCRT', 'DERO', 'ROSE', 'NYM', 'BEAM'],
  'solana': ['SOL', 'RAY', 'JTO', 'PYTH', 'JUP', 'ORCA', 'WIF', 'BONK', 'MOBILE', 'RENDER', 'HNT', 'FIDA', 'SAMO'],
  'ethereum': ['ETH', 'OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'ENS', 'LDO', 'SHIB', 'LINK', 'UNI', 'AAVE'],
  'bitcoin': ['BTC', 'STX', 'ORDI', 'SATS', 'BCH', 'BSV', 'ROOT'],
  'bnb': ['BNB', 'CAKE', 'BSW', 'XVS', 'ALPACA', 'TWT'],
  'rwa': ['ONDO', 'MKR', 'CFG', 'RIO', 'PROPS', 'POLY', 'TRADE', 'TOKEN'],
  'depin': ['HNT', 'FIL', 'AR', 'RNDR', 'THETA', 'AKT', 'IOTX', 'LPT'],
  'oracles': ['LINK', 'BAND', 'TRB', 'API3', 'UMA', 'DIA'],
  'payments': ['XRP', 'XLM', 'BCH', 'LTC', 'DASH', 'NANO', 'DGB', 'MOB'],
  'metaverse': ['MANA', 'SAND', 'AXS', 'ENJ', 'GALA', 'APE', 'THETA', 'HIGH', 'RACA'],
  'nft': ['BLUR', 'LOOKS', 'APE', 'ENJ', 'IMX', 'MAGIC', 'X2Y2', 'SUPER', 'RARE'],
  'storage': ['FIL', 'AR', 'STORJ', 'SC', 'BTT', 'BLZ'],
  'infrastructure': ['LINK', 'GRT', 'FIL', 'AR', 'HBAR', 'ICP', 'ANKR', 'KDA', 'SYS'],
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
