
export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Classification of coin symbols
export const defiTokens = ['uni', 'aave', 'mkr', 'snx', 'comp', 'cake', 'crv', 'sushi', '1inch', 'ldo', 'bal', 'rpl', 'cvx'];
export const platformTokens = ['eth', 'sol', 'ada', 'avax', 'dot', 'near', 'atom', 'trx', 'ftm', 'matic', 'kas', 'sui', 'apt', 'sei'];

// High potential low/mid cap tokens
export const lowCapGems = ['kas', 'sui', 'apt', 'sei', 'arb', 'op', 'inj', 'tia', 'rune', 'pendle', 'wld', 'jup', 'jto', 'strk', 'pyth', 'dym', 'alt', 'manta'];
export const memeTokens = ['doge', 'shib', 'pepe', 'floki', 'bonk', 'wif', 'bome', 'slerf', 'mew'];
export const aiTokens = ['fet', 'agix', 'rndr', 'ocean', 'tau', 'phb', 'nmr', 'ctxc'];
export const gamingTokens = ['axs', 'sand', 'mana', 'enjin', 'gala', 'ilv', 'alice', 'tlm', 'ygg'];

// Flow generation parameters
export const BTC_FLOW_THRESHOLD = 0.1;  // Reduced threshold for BTC flows
export const MIN_BTC_FLOWS = 5;  // Minimum number of BTC flows to include
export const TOP_COINS_COUNT = 8;  // Number of top coins to consider for synthetic flows
export const MAX_FLOWS = 35;  // Increased number of flows to return
export const TOTAL_COINS_FETCH = 500;  // Total coins to fetch from API
