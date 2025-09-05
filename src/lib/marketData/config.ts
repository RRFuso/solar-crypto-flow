
export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Classification of coin symbols - expandido para incluir mais tokens
export const defiTokens = ['uni', 'aave', 'mkr', 'snx', 'comp', 'cake', 'crv', 'sushi', '1inch', 'ldo', 'bal', 'rpl', 'cvx'];
export const platformTokens = ['eth', 'sol', 'ada', 'avax', 'dot', 'near', 'atom', 'trx', 'ftm', 'matic', 'kas', 'sui', 'apt', 'sei'];

// Flow generation parameters
export const BTC_FLOW_THRESHOLD = 0.1;  // Reduced threshold for BTC flows
export const MIN_BTC_FLOWS = 5;  // Minimum number of BTC flows to include
export const TOP_COINS_COUNT = 8;  // Number of top coins to consider for synthetic flows
export const MAX_FLOWS = 35;  // Increased number of flows to return
export const TOTAL_COINS_FETCH = 500;  // Total coins to fetch from API
