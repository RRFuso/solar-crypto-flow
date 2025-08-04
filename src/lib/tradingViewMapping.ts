/**
 * Mapping from CoinGecko IDs to TradingView symbols
 * This ensures that when users click on a crypto from CoinGecko data,
 * the correct TradingView chart symbol is used
 */
export const COINGECKO_TO_TRADINGVIEW_MAPPING: Record<string, string> = {
  // Major cryptocurrencies
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'ripple': 'XRP',
  'solana': 'SOL',
  'cardano': 'ADA',
  'dogecoin': 'DOGE',
  'avalanche-2': 'AVAX',
  'polkadot': 'DOT',
  'chainlink': 'LINK',
  'litecoin': 'LTC',
  'bitcoin-cash': 'BCH',
  'ethereum-classic': 'ETC',
  'stellar': 'XLM',
  'vechain': 'VET',
  'filecoin': 'FIL',
  'tron': 'TRX',
  'monero': 'XMR',
  'hedera-hashgraph': 'HBAR',
  'internet-computer': 'ICP',
  'the-graph': 'GRT',
  'cosmos': 'ATOM',
  'theta-token': 'THETA',
  'algorand': 'ALGO',
  'zcash': 'ZEC',
  'elrond-erd-2': 'EGLD',
  'tezos': 'XTZ',
  'eos': 'EOS',
  'aave': 'AAVE',
  'maker': 'MKR',
  'compound-governance-token': 'COMP',
  'uniswap': 'UNI',
  'sushi': 'SUSHI',
  'pancakeswap-token': 'CAKE',
  'curve-dao-token': 'CRV',
  'yearn-finance': 'YFI',
  '1inch': '1INCH',
  'synthetix-network-token': 'SNX',
  'thorchain': 'RUNE',
  
  // Stablecoins
  'tether': 'USDT',
  'usd-coin': 'USDC',
  'binance-usd': 'BUSD',
  'dai': 'DAI',
  'terrausd': 'UST',
  'true-usd': 'TUSD',
  'paxos-standard': 'USDP',
  'frax': 'FRAX',
  
  // Layer 2 & Scaling
  'matic-network': 'MATIC',
  'optimism': 'OP',
  'arbitrum': 'ARB',
  'immutable-x': 'IMX',
  'loopring': 'LRC',
  'starknet': 'STRK',
  
  // Memecoins
  'shiba-inu': 'SHIB',
  'pepe': 'PEPE',
  'floki': 'FLOKI',
  'dogwifhat': 'WIF',
  'bonk': 'BONK',
  'memecoin-2': 'MEME',
  'turbo': 'TURBO',
  
  // Gaming & Metaverse
  'the-sandbox': 'SAND',
  'decentraland': 'MANA',
  'axie-infinity': 'AXS',
  'gala': 'GALA',
  'enjincoin': 'ENJ',
  'stepn': 'GMT',
  'apecoin': 'APE',
  
  // AI & Data
  'fetch-ai': 'FET',
  'singularitynet': 'AGIX',
  'ocean-protocol': 'OCEAN',
  'render-token': 'RNDR',
  'numeraire': 'NMR',
  'cortex': 'CTXC',
  
  // DeFi Tokens
  'balancer': 'BAL',
  'kyber-network-crystal': 'KNC',
  'bancor': 'BNT',
  '0x': 'ZRX',
  'reserve-rights': 'RSR',
  'ampleforth': 'AMPL',
  'uma': 'UMA',
  'badger-dao': 'BADGER',
  
  // Infrastructure
  'near': 'NEAR',
  'fantom': 'FTM',
  'harmony': 'ONE',
  'zilliqa': 'ZIL',
  'dash': 'DASH',
  'basic-attention-token': 'BAT',
  'kyber-network': 'KNC',
  
  // Others
  'chiliz': 'CHZ',
  'celsius-degree-token': 'CEL',
  'nexo': 'NEXO',
  'crypto-com-chain': 'CRO',
  'okb': 'OKB',
  'huobi-token': 'HT',
  'ftx-token': 'FTT',
  'leo-token': 'LEO',
  
  // Newer tokens
  'ton': 'TON',
  'aptos': 'APT',
  'sui': 'SUI',
  'sei-network': 'SEI',
  'celestia': 'TIA',
  'injective-protocol': 'INJ',
  'kaspa': 'KAS',
  'worldcoin-wld': 'WLD',
  'pyth-network': 'PYTH',
  'jito-governance-token': 'JTO',
  'jupiter-exchange-solana': 'JUP',
  'wormhole': 'W',
  'ethena': 'ENA',
  'notcoin': 'NOT',
  'io': 'IO',
  'zksync': 'ZK',
  'pendle': 'PENDLE',
  'mantra-dao': 'OM',
  'restaked-swell': 'RSWETH',
  'wrapped-beacon-eth': 'WBETH',
  'lido-staked-ether': 'STETH',
  'rocket-pool-eth': 'RETH'
};

/**
 * Maps a CoinGecko crypto ID to the corresponding TradingView symbol
 * Falls back to the symbol property if no mapping is found
 */
export function mapCoinGeckoToTradingView(crypto: { id: string; symbol: string }): string {
  // First try to get the mapped symbol from CoinGecko ID
  const mappedSymbol = COINGECKO_TO_TRADINGVIEW_MAPPING[crypto.id];
  if (mappedSymbol) {
    return mappedSymbol;
  }
  
  // If no mapping found, use the symbol and make sure it's uppercase
  return crypto.symbol.toUpperCase();
}

/**
 * Checks if a symbol is available on Binance (TradingView uses Binance data)
 * This helps filter out symbols that might not have charts available
 */
export function isValidTradingViewSymbol(symbol: string): boolean {
  // Common symbols that are always available
  const commonSymbols = [
    'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK',
    'LTC', 'BCH', 'XLM', 'VET', 'FIL', 'TRX', 'HBAR', 'ICP', 'GRT', 'ATOM',
    'AAVE', 'MKR', 'UNI', 'SUSHI', 'CAKE', 'CRV', 'SHIB', 'PEPE', 'FLOKI',
    'SAND', 'MANA', 'AXS', 'GALA', 'ENJ', 'FET', 'AGIX', 'OCEAN', 'RNDR',
    'MATIC', 'OP', 'ARB', 'IMX', 'NEAR', 'FTM', 'ONE', 'ZIL', 'CHZ', 'CRO',
    'TON', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'KAS', 'WLD', 'PYTH', 'JTO',
    'JUP', 'W', 'ENA', 'NOT', 'IO', 'ZK', 'PENDLE', 'OM'
  ];
  
  return commonSymbols.includes(symbol);
}
