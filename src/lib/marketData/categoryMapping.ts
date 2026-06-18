// Mapeamento refinado de criptomoedas para categorias
export const CRYPTO_CATEGORIES: Record<string, string[]> = {
  'layer1': [
    'BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'BNB', 'XRP', 'TRX', 'LTC', 
    'ATOM', 'ALGO', 'XTZ', 'FTM', 'EOS', 'VET', 'HBAR', 'EGLD', 'FLOW', 'ICP', 
    'KAS', 'INJ', 'SUI', 'SEI', 'TON', 'APT', 'ETC', 'FLR', 'KAVA', 'ROSE', 
    'ONE', 'ZIL', 'WAVES', 'QTUM', 'ICX', 'LSK', 'IOTA', 'XEM', 'MINA'
  ],
  'layer2': [
    'OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'MANTA', 'METIS', 'SKL', 'BOBA', 
    'OMG', 'ZKS', 'CELO', 'POLYGON', 'LRC', 'DYDX', 'ZRO', 'BLAST', 'BASE',
    'ZKSYNC', 'LINEA', 'SCROLL', 'MANTLE', 'MODE'
  ],
  'defi': [
    'UNI', 'AAVE', 'MKR', 'COMP', 'CRV', 'SNX', 'CAKE', 'LDO', 'FXS', 'RUNE', 
    'RPL', 'SUSHI', 'YFI', 'ZRX', '1INCH', 'BAL', 'GMX', 'PENDLE', 'JOE', 
    'DYDX', 'ENA', 'JLP', 'INST', 'CVX', 'FXS', 'ALCX', 'SPELL', 'ICE', 
    'QI', 'BIFI', 'ALPHA', 'AUTO', 'BANANA', 'BUNNY'
  ],
  'memecoin': [
    'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK', 'BOME', 'MEME', 'TURBO', 
    'COQ', 'MYRO', 'MOG', 'PEPECOIN', 'TRUMP', 'PUMP', 'PENGU', 'WOJAK', 
    'LADYS', 'PEPE2', 'BOB', 'DOGE2', 'ELON', 'DOGELON', 'BABYDOGE', 'KISHU',
    'AKITA', 'HOGE', 'SAITAMA'
  ],
  'stablecoin': [
    'USDT', 'USDC', 'DAI', 'TUSD', 'BUSD', 'FRAX', 'USDP', 'GUSD', 'PAXG', 
    'PYUSD', 'USDE', 'BSC-USD', 'USDF', 'USDS', 'SUSDE', 'LUSD', 'SUSD', 
    'USDD', 'USDX', 'UST', 'USDN', 'USDT0', 'USD1'
  ],
  'gaming': [
    'AXS', 'SAND', 'GALA', 'ENJ', 'MANA', 'IMX', 'BEAM', 'PRIME', 'RONIN', 
    'ILV', 'YGG', 'PYR', 'UOS', 'ALICE', 'NAKA', 'GHST', 'TOWER', 'SLP', 
    'TLM', 'WAXP', 'RADIO', 'GODS', 'VOXEL', 'MOBOX', 'DPET'
  ],
  'ai': [
    'FET', 'AGIX', 'RNDR', 'GRT', 'OCEAN', 'NMR', 'TAO', 'ARKM', 'WLD', 
    'AKT', 'PAAL', 'AIOZ', 'ORAI', 'RENDER', 'IQID', 'PHB', 'CTXC', 
    'MATRIX', 'AGI', 'DEEP', 'ALI'
  ],
  'privacy': [
    'XMR', 'ZEC', 'DASH', 'ZEN', 'SCRT', 'DERO', 'ROSE', 'NYM', 'BEAM', 
    'FIRO', 'ARRR', 'XVG', 'NAV', 'PIVX', 'PART', 'XZC'
  ],
  'solana': [
    'SOL', 'RAY', 'JTO', 'PYTH', 'JUP', 'ORCA', 'WIF', 'BONK', 'MOBILE', 
    'RENDER', 'HNT', 'FIDA', 'SAMO', 'JITOSOL', 'BNSOL', 'MSOL', 'STEP',
    'SRM', 'COPE', 'MNGO', 'PORT'
  ],
  'ethereum': [
    'ETH', 'OP', 'ARB', 'MATIC', 'STRK', 'IMX', 'ENS', 'LDO', 'SHIB', 
    'LINK', 'UNI', 'AAVE', 'STETH', 'WETH', 'WBETH', 'RETH', 'OSETH', 
    'LSETH', 'RSETH', 'WEETH', 'MKR', 'COMP', 'SNX', 'CRV', 'BAL', 
    'SUSHI', 'YFI', 'ZRX', '1INCH'
  ],
  'bitcoin': [
    'BTC', 'STX', 'ORDI', 'SATS', 'BCH', 'BSV', 'ROOT', 'WBTC', 'LBTC', 
    'CBBTC', 'BTCB', 'RBTC', 'TBTC', 'BBTC', 'RENBTC'
  ],
  'bnb': [
    'BNB', 'CAKE', 'BSW', 'XVS', 'ALPACA', 'TWT', 'BAKE', 'BURGER', 
    'AUTO', 'EPS', 'BREW', 'WATCH', 'NAUT'
  ],
  'rwa': [
    'ONDO', 'MKR', 'CFG', 'RIO', 'PROPS', 'POLY', 'TRADE', 'TOKEN', 
    'BUIDL', 'RWA', 'TRU', 'MPL', 'SWRV'
  ],
  'depin': [
    'HNT', 'FIL', 'AR', 'RNDR', 'THETA', 'AKT', 'IOTX', 'LPT', 'STORJ', 
    'SC', 'BTT', 'ANKR', 'POKT', 'NKN', 'DIMO', 'HONEY'
  ],
  'oracles': [
    'LINK', 'BAND', 'TRB', 'API3', 'UMA', 'DIA', 'PYTH', 'NEST', 'FLUX', 
    'DOS', 'TELLOR'
  ],
  'payments': [
    'XRP', 'XLM', 'BCH', 'LTC', 'DASH', 'NANO', 'DGB', 'MOB', 'XEM', 
    'HBAR', 'ALGO', 'CELO', 'AMP', 'FLEXA', 'REQ', 'COTI'
  ],
  'metaverse': [
    'MANA', 'SAND', 'AXS', 'ENJ', 'GALA', 'APE', 'THETA', 'HIGH', 'RACA', 
    'ILV', 'VOXEL', 'STARL', 'UFO', 'POLS', 'BLOK', 'Nftb'
  ],
  'nft': [
    'BLUR', 'LOOKS', 'APE', 'ENJ', 'IMX', 'MAGIC', 'X2Y2', 'SUPER', 'RARE', 
    'NFTX', 'RARI', 'GHST', 'WHALE', 'MASK', 'DERC'
  ],
  'storage': [
    'FIL', 'AR', 'STORJ', 'SC', 'BTT', 'BLZ', 'CRUST', 'HOT', 'SAFE', 
    'MASS', 'STORX'
  ],
  'infrastructure': [
    'LINK', 'GRT', 'FIL', 'AR', 'HBAR', 'ICP', 'ANKR', 'KDA', 'SYS', 
    'QNT', 'POKT', 'NKN', 'CKB', 'CELR', 'SKL', 'LRC'
  ],
  'cex-token': [
    'BNB', 'OKB', 'CRO', 'WBT', 'GT', 'KCS', 'LEO', 'BGB', 'MNT', 'HT', 
    'FTT', 'WRX', 'BKEX', 'BIKI'
  ],
  'lst': [
    'STETH', 'WSTETH', 'WBETH', 'RETH', 'JITOSOL', 'OSETH', 'LSETH', 
    'RSETH', 'WEETH', 'BNSOL', 'MSOL', 'STSOL', 'CBETH', 'FRXETH', 
    'SETH2', 'ANKRETH'
  ]
};

// ============================================================
// Indexes pre-computed once at module load for O(1) lookups.
// Avoids O(N*M) scans inside hot render paths.
// ============================================================

/** category -> Set<SYMBOL> (uppercase) for instant membership checks */
const CATEGORY_SETS: Record<string, Set<string>> = (() => {
  const out: Record<string, Set<string>> = {};
  for (const [category, tokens] of Object.entries(CRYPTO_CATEGORIES)) {
    out[category] = new Set(tokens.map((t) => t.toUpperCase()));
  }
  return out;
})();

/** SYMBOL (uppercase) -> categories[] reverse index, frozen for safe sharing */
const SYMBOL_TO_CATEGORIES: Map<string, readonly string[]> = (() => {
  const acc = new Map<string, string[]>();
  for (const [category, tokens] of Object.entries(CRYPTO_CATEGORIES)) {
    for (const token of tokens) {
      const key = token.toUpperCase();
      let arr = acc.get(key);
      if (!arr) {
        arr = [];
        acc.set(key, arr);
      }
      if (!arr.includes(category)) arr.push(category);
    }
  }
  const frozen = new Map<string, readonly string[]>();
  acc.forEach((v, k) => frozen.set(k, Object.freeze(v)));
  return frozen;
})();

const EMPTY_CATEGORIES: readonly string[] = Object.freeze([]);

/**
 * Determina se um símbolo pertence a uma categoria específica.
 * O(1) via Set lookup.
 */
export const belongsToCategory = (symbol: string, category: string): boolean => {
  if (category === 'all') return true;
  const set = CATEGORY_SETS[category];
  if (!set) return false;
  return set.has(symbol.toUpperCase());
};

/**
 * Retorna todas as categorias às quais um símbolo pertence.
 * O(1) via reverse index. Retorna a MESMA referência a cada chamada
 * para o mesmo símbolo (útil para memoização downstream).
 */
export const getCategoriesForSymbol = (symbol: string): readonly string[] => {
  return SYMBOL_TO_CATEGORIES.get(symbol.toUpperCase()) ?? EMPTY_CATEGORIES;
};
