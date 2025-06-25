
export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Classification of coin symbols
export const defiTokens = ['uni', 'aave', 'mkr', 'snx', 'comp', 'cake', 'crv', 'sushi'];
export const platformTokens = ['eth', 'sol', 'ada', 'avax', 'dot', 'near', 'atom', 'trx', 'ftm', 'matic'];

// Flow generation parameters
export const BTC_FLOW_THRESHOLD = 0.1;  // Reduced threshold for BTC flows
export const MIN_BTC_FLOWS = 5;  // Minimum number of BTC flows to include
export const TOP_COINS_COUNT = 8;  // Number of top coins to consider for synthetic flows
export const MAX_FLOWS = 20;  // Maximum number of flows to return
