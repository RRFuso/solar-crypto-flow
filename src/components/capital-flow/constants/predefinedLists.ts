
// Stablecoins que sempre aparecem junto com BTC
export const FIXED_COINS = ['BTC', 'USDT', 'USDC', 'DAI', 'BUSD'];

// Listas predefinidas estratégicas
export const PREDEFINED_LISTS = {
  // Paginação por ranking (0-99, 100-199, etc.)
  'top-100': { label: 'Top 1-100', range: [0, 99] },
  'top-200': { label: 'Top 100-200', range: [100, 199] },
  'top-300': { label: 'Top 200-300', range: [200, 299] },
  'top-400': { label: 'Top 300-400', range: [300, 399] },
  'top-500': { label: 'Top 400-500', range: [400, 499] },
  'top-600': { label: 'Top 500-600', range: [500, 599] },
  'top-700': { label: 'Top 600-700', range: [600, 699] },
  'top-800': { label: 'Top 700-800', range: [700, 799] },
  'top-900': { label: 'Top 800-900', range: [800, 899] },
  'top-1000': { label: 'Top 900-1000', range: [900, 999] },
  
  // Listas estratégicas
  'volume-spike': { 
    label: '📊 Volume Spike', 
    description: 'Criptos com aumento anormal de volume nas últimas 24h',
    dynamic: true 
  },
  'gainers': { 
    label: '🚀 Top Gainers', 
    description: 'Maiores altas nas últimas 24h',
    dynamic: true 
  },
  'losers': { 
    label: '📉 Top Losers', 
    description: 'Maiores quedas nas últimas 24h',
    dynamic: true 
  },
  'attention': { 
    label: '👀 Alta Atenção', 
    description: 'Criptos com maior movimentação e interesse',
    dynamic: true 
  },
  'new-listings': { 
    label: '🆕 Novas Listagens', 
    description: 'Tokens recentemente listados',
    dynamic: true 
  },
};

// Categorias de criptos para filtro
export const CRYPTO_CATEGORIES: Record<string, string[]> = {
  layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XTZ', 'ICP', 'HBAR', 'EOS', 'XLM', 'VET', 'ONE', 'EGLD', 'KAVA', 'ROSE', 'MINA', 'KDA', 'CFX', 'CELO', 'ZIL'],
  layer2: ['MATIC', 'ARB', 'OP', 'IMX', 'METIS', 'LRC', 'BOBA', 'ZKS', 'STRK', 'MANTA', 'BLAST', 'SCROLL', 'LINEA', 'BASE', 'MODE'],
  defi: ['UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'COMP', 'YFI', 'SUSHI', '1INCH', 'BAL', 'DYDX', 'GMX', 'PERP', 'LQTY', 'PENDLE', 'MORPHO', 'EIGEN'],
  memecoin: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'MEME', 'TURBO', 'BOME', 'COQ', 'MYRO', 'BRETT', 'POPCAT', 'NEIRO', 'PNUT', 'MOG', 'SPX'],
  stablecoin: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP', 'PYUSD', 'GHO', 'LUSD', 'MIM', 'CRVUSD', 'EURC'],
  gaming: ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'ILV', 'MAGIC', 'RONIN', 'BEAM', 'PIXEL', 'PRIME', 'PORTAL', 'XAI', 'SAGA'],
  ai: ['FET', 'AGIX', 'OCEAN', 'RNDR', 'ARKM', 'WLD', 'TAO', 'VIRTUAL', 'AI16Z', 'ZEREBRO', 'GRIFFAIN', 'ARC', 'GOAT', 'FARTCOIN'],
  privacy: ['XMR', 'ZEC', 'DASH', 'DCR', 'SCRT', 'ROSE', 'NYM', 'BEAM', 'PIVX'],
  solana: ['SOL', 'RAY', 'SRM', 'ORCA', 'MNGO', 'STEP', 'JTO', 'JUP', 'PYTH', 'W', 'JITO', 'MARINADE', 'BONK', 'WIF', 'BOME'],
  ethereum: ['ETH', 'stETH', 'rETH', 'cbETH', 'UNI', 'AAVE', 'MKR', 'LDO', 'ENS', 'RPL', 'SSV', 'EIGEN', 'ETHFI'],
  bitcoin: ['BTC', 'WBTC', 'tBTC', 'cbBTC', 'ORDI', 'SATS', 'RUNES', 'STX', 'ALEX', 'PIPE'],
  bnb: ['BNB', 'CAKE', 'XVS', 'ALPACA', 'BAKE', 'BURGER', 'BISWAP', 'RACA', 'BSW'],
  rwa: ['ONDO', 'MPL', 'CFG', 'RIO', 'PROPS', 'CPOOL', 'GFI', 'MAPLE'],
  payments: ['XRP', 'XLM', 'HBAR', 'ALGO', 'CELO', 'ACH', 'AMP', 'PYUSD'],
  metaverse: ['SAND', 'MANA', 'AXS', 'ENJ', 'APE', 'HIGH', 'RARI', 'AUDIO'],
  nft: ['BLUR', 'X2Y2', 'LOOKS', 'RARE', 'SUPER', 'ENJ', 'AUDIO'],
  storage: ['FIL', 'AR', 'STORJ', 'SIA', 'BTT', 'HOT'],
  infrastructure: ['LINK', 'GRT', 'API3', 'BAND', 'TRB', 'PYTH', 'UMA', 'DIA', 'FLUX', 'POKT', 'NKN', 'ANKR'],
};

// Helper para obter categoria de um símbolo
export function getCategoryForSymbol(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase();
  const categories: string[] = [];
  
  for (const [category, symbols] of Object.entries(CRYPTO_CATEGORIES)) {
    if (symbols.includes(upperSymbol)) {
      categories.push(category);
    }
  }
  
  return categories.length > 0 ? categories : ['other'];
}

// Helper para verificar se símbolo pertence a categoria
export function belongsToCategory(symbol: string, category: string): boolean {
  if (category === 'all') return true;
  const upperSymbol = symbol.toUpperCase();
  return CRYPTO_CATEGORIES[category]?.includes(upperSymbol) ?? false;
}
