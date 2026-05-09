
// Listas predefinidas estratégicas
export const PREDEFINED_LISTS = {
  // Paginação por ranking (0-99, 100-199, etc.)
  'top-100': { label: 'Top 1-100', range: [1, 100], dynamic: false },
  'top-200': { label: 'Top 100-200', range: [100, 200], dynamic: false },
  'top-300': { label: 'Top 200-300', range: [200, 300], dynamic: false },
  'top-400': { label: 'Top 300-400', range: [300, 400], dynamic: false },
  'top-500': { label: 'Top 400-500', range: [400, 500], dynamic: false },
  'top-600': { label: 'Top 500-600', range: [500, 600], dynamic: false },
  'top-700': { label: 'Top 600-700', range: [600, 700], dynamic: false },
  'top-800': { label: 'Top 700-800', range: [700, 800], dynamic: false },
  'top-900': { label: 'Top 800-900', range: [800, 900], dynamic: false },
  'top-1000': { label: 'Top 900-1000', range: [900, 1000], dynamic: false },
  
  // Listas estratégicas dinâmicas
  'volume-spike': { 
    label: '📊 Volume Spike', 
    description: 'Giro de capital desproporcional ao market cap',
    dynamic: true 
  },
  'gainers': { 
    label: '🚀 Top Gainers', 
    description: 'Maiores altas 24h por price_change',
    dynamic: true 
  },
  'losers': { 
    label: '📉 Top Losers', 
    description: 'Maiores quedas 24h por price_change',
    dynamic: true 
  },
  'attention': { 
    label: '🔥 Alta Atenção', 
    description: 'Hot Score: volatilidade × volume × ranking',
    dynamic: true 
  },
  'new-listings': { 
    label: '🆕 Novas Listagens', 
    description: 'Tokens listados recentemente',
    dynamic: true 
  },
};

// Helper para verificar se uma lista é dinâmica
export function isDynamicList(listKey: string): boolean {
  const list = PREDEFINED_LISTS[listKey as keyof typeof PREDEFINED_LISTS];
  return list?.dynamic === true;
}

// Categorias de criptos para filtro
export const CRYPTO_CATEGORIES: Record<string, string[]> = {
  layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XTZ', 'ICP', 'HBAR', 'EOS', 'XLM', 'VET', 'ONE', 'EGLD', 'KAVA', 'ROSE', 'MINA', 'KDA', 'CFX', 'CELO', 'ZIL', 'SUI', 'SEI', 'TON', 'APT'],
  layer2: ['MATIC', 'ARB', 'OP', 'IMX', 'METIS', 'LRC', 'BOBA', 'ZKS', 'STRK', 'MANTA', 'BLAST', 'SCROLL', 'LINEA', 'BASE', 'MODE', 'MANTLE', 'ZRO'],
  defi: ['UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'COMP', 'YFI', 'SUSHI', '1INCH', 'BAL', 'DYDX', 'GMX', 'PERP', 'LQTY', 'PENDLE', 'MORPHO', 'EIGEN', 'ENA'],
  memecoin: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'MEME', 'TURBO', 'BOME', 'COQ', 'MYRO', 'BRETT', 'POPCAT', 'NEIRO', 'PNUT', 'MOG', 'SPX', 'TRUMP'],
  stablecoin: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP', 'PYUSD', 'GHO', 'LUSD', 'MIM', 'CRVUSD', 'EURC'],
  gaming: ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'ILV', 'MAGIC', 'RONIN', 'BEAM', 'PIXEL', 'PRIME', 'PORTAL', 'XAI', 'SAGA'],
  ai: ['FET', 'AGIX', 'OCEAN', 'RNDR', 'ARKM', 'WLD', 'TAO', 'VIRTUAL', 'AI16Z', 'ZEREBRO', 'GRIFFAIN', 'ARC', 'GOAT', 'FARTCOIN', 'AKT', 'AIOZ'],
  privacy: ['XMR', 'ZEC', 'DASH', 'DCR', 'SCRT', 'ROSE', 'NYM', 'BEAM', 'PIVX'],
  solana: ['SOL', 'RAY', 'SRM', 'ORCA', 'MNGO', 'STEP', 'JTO', 'JUP', 'PYTH', 'W', 'JITO', 'MARINADE', 'BONK', 'WIF', 'BOME'],
  ethereum: ['ETH', 'stETH', 'rETH', 'cbETH', 'UNI', 'AAVE', 'MKR', 'LDO', 'ENS', 'RPL', 'SSV', 'EIGEN', 'ETHFI'],
  bitcoin: ['BTC', 'WBTC', 'tBTC', 'cbBTC', 'ORDI', 'SATS', 'RUNES', 'STX', 'ALEX', 'PIPE'],
  bnb: ['BNB', 'CAKE', 'XVS', 'ALPACA', 'BAKE', 'BURGER', 'BISWAP', 'RACA', 'BSW'],
  rwa: ['ONDO', 'MPL', 'CFG', 'RIO', 'PROPS', 'CPOOL', 'GFI', 'MAPLE', 'TRU'],
  depin: ['HNT', 'FIL', 'AR', 'RNDR', 'THETA', 'AKT', 'IOTX', 'LPT', 'STORJ', 'SC', 'BTT', 'ANKR', 'POKT', 'NKN', 'DIMO'],
  oracles: ['LINK', 'BAND', 'TRB', 'API3', 'UMA', 'DIA', 'PYTH', 'FLUX'],
  payments: ['XRP', 'XLM', 'HBAR', 'ALGO', 'CELO', 'ACH', 'AMP', 'PYUSD'],
  metaverse: ['SAND', 'MANA', 'AXS', 'ENJ', 'APE', 'HIGH', 'RARI', 'AUDIO'],
  nft: ['BLUR', 'X2Y2', 'LOOKS', 'RARE', 'SUPER', 'ENJ', 'AUDIO'],
  storage: ['FIL', 'AR', 'STORJ', 'SIA', 'BTT', 'HOT'],
  infrastructure: ['LINK', 'GRT', 'API3', 'BAND', 'TRB', 'PYTH', 'UMA', 'DIA', 'FLUX', 'POKT', 'NKN', 'ANKR'],
  'cex-token': ['BNB', 'OKB', 'CRO', 'WBT', 'GT', 'KCS', 'LEO', 'BGB', 'MNT', 'HT'],
  lst: ['STETH', 'WSTETH', 'WBETH', 'RETH', 'JITOSOL', 'OSETH', 'MSOL', 'CBETH', 'WEETH', 'BNSOL'],
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
