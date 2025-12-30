// ========== SMART CACHE SYSTEM ==========
// In-memory cache with TTL, batching, and intelligent invalidation

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTTL: number;        // Default TTL in ms
  maxEntries: number;        // Max cache entries
  cleanupInterval: number;   // Cleanup interval in ms
  enableMetrics: boolean;    // Track cache metrics
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

// ========== SMART CACHE CLASS ==========
export class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private pendingRequests = new Map<string, Promise<T>>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000,  // 5 minutes
      maxEntries: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      ...config,
    };

    this.startCleanup();
  }

  // Get item from cache
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.hits++;
    this.updateHitRate();

    return entry.data;
  }

  // Set item in cache
  set(key: string, data: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
    });

    this.metrics.size = this.cache.size;
  }

  // Get or fetch with deduplication
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = fetcher().then((data) => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  // Batch get or fetch
  async batchGetOrFetch<K extends string>(
    keys: K[],
    batchFetcher: (missingKeys: K[]) => Promise<Map<K, T>>,
    ttl?: number
  ): Promise<Map<K, T>> {
    const results = new Map<K, T>();
    const missingKeys: K[] = [];

    // Check cache for each key
    for (const key of keys) {
      const cached = this.get(key);
      if (cached !== undefined) {
        results.set(key, cached);
      } else {
        missingKeys.push(key);
      }
    }

    // Batch fetch missing keys
    if (missingKeys.length > 0) {
      const fetched = await batchFetcher(missingKeys);
      for (const [key, data] of fetched) {
        this.set(key, data, ttl);
        results.set(key, data);
      }
    }

    return results;
  }

  // Invalidate by key
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  // Invalidate by pattern
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.metrics.size = 0;
  }

  // Get metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics, size: this.cache.size };
  }

  // Evict least recently used
  private evictLRU(): void {
    let oldest: { key: string; lastAccessed: number } | null = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = { key, lastAccessed: entry.lastAccessed };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
      this.metrics.evictions++;
    }
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  // Start cleanup timer
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (now > entry.timestamp + entry.ttl) {
          this.cache.delete(key);
        }
      }
      this.metrics.size = this.cache.size;
    }, this.config.cleanupInterval);
  }

  // Stop cleanup timer
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// ========== SINGLETON INSTANCES ==========

// Cache for on-chain data (longer TTL)
export const onChainCache = new SmartCache<any>({
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxEntries: 500,
});

// Cache for price data (shorter TTL)
export const priceCache = new SmartCache<any>({
  defaultTTL: 30 * 1000, // 30 seconds
  maxEntries: 200,
});

// Cache for smart money flows
export const flowCache = new SmartCache<any>({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
});

// ========== BATCH REQUEST HELPER ==========
export async function batchedFetch<T>(
  items: string[],
  batchSize: number,
  fetcher: (batch: string[]) => Promise<Map<string, T>>,
  delayMs: number = 100
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await fetcher(batch);
    
    for (const [key, value] of batchResults) {
      results.set(key, value);
    }
    
    // Delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
