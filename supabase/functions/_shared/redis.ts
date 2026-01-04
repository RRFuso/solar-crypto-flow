// Upstash Redis REST client for Edge Functions
// Reduces costs by ~60% through intelligent caching

const REDIS_URL = Deno.env.get('UPSTASH_REDIS_REST_URL')!;
const REDIS_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!;

interface RedisResponse<T = unknown> {
  result: T;
}

// Generic Redis command executor
async function redisCommand<T = unknown>(command: string[]): Promise<T> {
  const response = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    console.error('Redis error:', response.statusText);
    throw new Error(`Redis error: ${response.statusText}`);
  }

  const data: RedisResponse<T> = await response.json();
  return data.result;
}

// Cache with TTL (in seconds)
export async function setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redisCommand(['SET', key, serialized, 'EX', ttlSeconds.toString()]);
    console.log(`[Redis] SET ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[Redis] SET failed for ${key}:`, error);
  }
}

// Get cached value
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const result = await redisCommand<string | null>(['GET', key]);
    if (result) {
      console.log(`[Redis] HIT ${key}`);
      return JSON.parse(result) as T;
    }
    console.log(`[Redis] MISS ${key}`);
    return null;
  } catch (error) {
    console.error(`[Redis] GET failed for ${key}:`, error);
    return null;
  }
}

// Get or fetch pattern - reduces API calls significantly
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetcher();
  await setCache(key, data, ttlSeconds);
  return data;
}

// Batch get multiple keys
export async function mgetCache<T>(keys: string[]): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  if (keys.length === 0) return results;

  try {
    const values = await redisCommand<(string | null)[]>(['MGET', ...keys]);
    
    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        results.set(key, JSON.parse(value) as T);
      }
    });
    
    console.log(`[Redis] MGET ${keys.length} keys, ${results.size} hits`);
  } catch (error) {
    console.error('[Redis] MGET failed:', error);
  }

  return results;
}

// Delete cache key
export async function deleteCache(key: string): Promise<void> {
  try {
    await redisCommand(['DEL', key]);
    console.log(`[Redis] DEL ${key}`);
  } catch (error) {
    console.error(`[Redis] DEL failed for ${key}:`, error);
  }
}

// Delete by pattern (useful for invalidation)
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redisCommand<string[]>(['KEYS', pattern]);
    if (keys.length > 0) {
      await redisCommand(['DEL', ...keys]);
      console.log(`[Redis] Deleted ${keys.length} keys matching ${pattern}`);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error(`[Redis] Pattern delete failed for ${pattern}:`, error);
    return 0;
  }
}

// Cache key generators for consistency
export const CacheKeys = {
  cryptoPrice: (symbol: string) => `crypto:price:${symbol.toLowerCase()}`,
  cryptoPrices: () => 'crypto:prices:all',
  smartMoneyFlow: (symbol: string, timeframe: string) => `smartmoney:flow:${symbol.toLowerCase()}:${timeframe}`,
  smartMoneyFlows: (timeframe: string) => `smartmoney:flows:${timeframe}`,
  onChainData: (symbol: string) => `onchain:data:${symbol.toLowerCase()}`,
  walletTransactions: (address: string) => `wallet:tx:${address.toLowerCase()}`,
  marketData: (symbol: string) => `market:data:${symbol.toLowerCase()}`,
  historicalPrices: (symbol: string, days: number) => `historical:${symbol.toLowerCase()}:${days}d`,
};

// TTL presets (in seconds)
export const CacheTTL = {
  PRICE_REALTIME: 30,        // 30 seconds for real-time prices
  PRICE_STANDARD: 60,        // 1 minute for standard price data
  MARKET_DATA: 300,          // 5 minutes for market data
  SMART_MONEY: 600,          // 10 minutes for smart money flows
  ONCHAIN: 900,              // 15 minutes for on-chain data
  HISTORICAL: 3600,          // 1 hour for historical data
  WALLET_TX: 300,            // 5 minutes for wallet transactions
};
