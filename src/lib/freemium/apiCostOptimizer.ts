// ========== API COST OPTIMIZER ==========
// Intelligent caching and request optimization based on tier

import { SubscriptionTier, getTierConfig } from './tierConfig';
import { SmartCache } from '@/lib/cache/SmartCache';
import { ApiUsageTracker } from '@/services/api-usage-tracker';

// API cost constants (per request in USD)
export const API_COSTS = {
  alchemy: 0.0001,        // Alchemy Compute Units
  coingecko: 0.00001,     // Mostly free, minimal cost
  binance: 0,             // Free
  etherscan: 0.0005,      // Rate limited free tier
  dune: 0.001,            // Dune credits
  coinglass: 0.0002,      // Rate limited
  defillama: 0,           // Free
  gemini: 0.00002,        // AI requests
};

// Request priority levels
export type RequestPriority = 'critical' | 'high' | 'medium' | 'low';

interface OptimizedRequest {
  shouldProceed: boolean;
  useCache: boolean;
  cacheTTL: number;
  batchWith?: string[];
  delay?: number;
  reason?: string;
}

interface PendingBatchRequest {
  api: string;
  endpoint: string;
  params: Record<string, unknown>;
  priority: RequestPriority;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  addedAt: number;
}

class ApiCostOptimizerClass {
  private static instance: ApiCostOptimizerClass;
  private batchQueue: Map<string, PendingBatchRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();
  
  // Caches with tier-specific TTLs
  private tierCaches: Map<SubscriptionTier, {
    price: SmartCache<unknown>;
    flow: SmartCache<unknown>;
    onChain: SmartCache<unknown>;
  }> = new Map();

  private constructor() {
    this.initializeCaches();
    this.startBatchProcessor();
  }

  static getInstance(): ApiCostOptimizerClass {
    if (!ApiCostOptimizerClass.instance) {
      ApiCostOptimizerClass.instance = new ApiCostOptimizerClass();
    }
    return ApiCostOptimizerClass.instance;
  }

  private initializeCaches(): void {
    const tiers: SubscriptionTier[] = ['free', 'pro', 'premium'];
    
    for (const tier of tiers) {
      const config = getTierConfig(tier);
      this.tierCaches.set(tier, {
        price: new SmartCache({ 
          defaultTTL: config.limits.priceCacheTTL,
          maxEntries: tier === 'premium' ? 1000 : tier === 'pro' ? 500 : 200,
        }),
        flow: new SmartCache({ 
          defaultTTL: config.limits.flowCacheTTL,
          maxEntries: tier === 'premium' ? 500 : tier === 'pro' ? 200 : 50,
        }),
        onChain: new SmartCache({ 
          defaultTTL: config.limits.onChainCacheTTL,
          maxEntries: tier === 'premium' ? 300 : tier === 'pro' ? 100 : 30,
        }),
      });
    }
  }

  // Get cache for specific tier and type
  getCache(tier: SubscriptionTier, type: 'price' | 'flow' | 'onChain'): SmartCache<unknown> {
    const caches = this.tierCaches.get(tier);
    if (!caches) {
      return this.tierCaches.get('free')![type];
    }
    return caches[type];
  }

  // Evaluate if request should proceed
  evaluateRequest(
    api: string,
    tier: SubscriptionTier,
    priority: RequestPriority = 'medium'
  ): OptimizedRequest {
    const config = getTierConfig(tier);
    const now = Date.now();
    const apiKey = `${api}:${tier}`;
    
    // Get or create request count
    let requestInfo = this.requestCounts.get(apiKey);
    if (!requestInfo || requestInfo.resetAt < now) {
      requestInfo = { count: 0, resetAt: now + 60000 }; // Reset every minute
      this.requestCounts.set(apiKey, requestInfo);
    }

    // Check if we're over the per-minute limit
    if (requestInfo.count >= config.limits.apiRequestsPerMinute) {
      if (priority !== 'critical') {
        return {
          shouldProceed: false,
          useCache: true,
          cacheTTL: config.limits.flowCacheTTL,
          delay: requestInfo.resetAt - now,
          reason: 'Rate limit exceeded',
        };
      }
    }

    // Determine cache TTL based on tier and API
    let cacheTTL = config.limits.flowCacheTTL;
    if (api === 'alchemy' || api === 'etherscan') {
      cacheTTL = config.limits.onChainCacheTTL;
    } else if (api === 'binance' || api === 'coingecko') {
      cacheTTL = config.limits.priceCacheTTL;
    }

    // For free tier, aggressively batch and cache
    if (tier === 'free') {
      if (priority === 'low') {
        return {
          shouldProceed: false,
          useCache: true,
          cacheTTL: cacheTTL * 2, // Double cache time for low priority
          reason: 'Low priority request deferred',
        };
      }
    }

    // Increment request count
    requestInfo.count++;
    ApiUsageTracker.trackRequest(api, '', false);

    return {
      shouldProceed: true,
      useCache: false,
      cacheTTL,
    };
  }

  // Add request to batch queue
  addToBatch<T>(
    batchKey: string,
    api: string,
    endpoint: string,
    params: Record<string, unknown>,
    priority: RequestPriority = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }

      this.batchQueue.get(batchKey)!.push({
        api,
        endpoint,
        params,
        priority,
        resolve: resolve as (data: unknown) => void,
        reject,
        addedAt: Date.now(),
      });

      // Set timer to process batch if not already set
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, this.getBatchDelay(priority));
        this.batchTimers.set(batchKey, timer);
      }
    });
  }

  private getBatchDelay(priority: RequestPriority): number {
    switch (priority) {
      case 'critical': return 50;
      case 'high': return 100;
      case 'medium': return 500;
      case 'low': return 2000;
      default: return 500;
    }
  }

  private processBatch(batchKey: string): void {
    const batch = this.batchQueue.get(batchKey);
    if (!batch || batch.length === 0) {
      this.batchQueue.delete(batchKey);
      this.batchTimers.delete(batchKey);
      return;
    }

    // Sort by priority
    batch.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Process batch (this would be overridden by specific API handlers)
    console.log(`Processing batch ${batchKey} with ${batch.length} requests`);

    // Clear batch
    this.batchQueue.delete(batchKey);
    this.batchTimers.delete(batchKey);
  }

  private startBatchProcessor(): void {
    // Periodic batch processor
    setInterval(() => {
      for (const [batchKey, batch] of this.batchQueue.entries()) {
        if (batch.length > 0) {
          const oldestRequest = batch[0];
          // Process if oldest request is > 5 seconds old
          if (Date.now() - oldestRequest.addedAt > 5000) {
            this.processBatch(batchKey);
          }
        }
      }
    }, 1000);
  }

  // Get cost estimate for a set of API calls
  estimateCost(
    apiCalls: { api: string; count: number }[],
    tier: SubscriptionTier
  ): {
    withoutOptimization: number;
    withOptimization: number;
    savings: number;
    savingsPercent: number;
  } {
    const config = getTierConfig(tier);
    
    let withoutOptimization = 0;
    let withOptimization = 0;

    for (const { api, count } of apiCalls) {
      const costPerRequest = API_COSTS[api as keyof typeof API_COSTS] || 0;
      withoutOptimization += costPerRequest * count;
      
      // Estimate cache hit rate based on tier
      const cacheHitRate = tier === 'free' ? 0.8 : tier === 'pro' ? 0.6 : 0.4;
      withOptimization += costPerRequest * count * (1 - cacheHitRate);
    }

    const savings = withoutOptimization - withOptimization;
    const savingsPercent = withoutOptimization > 0 
      ? (savings / withoutOptimization) * 100 
      : 0;

    return {
      withoutOptimization,
      withOptimization,
      savings,
      savingsPercent,
    };
  }

  // Get optimization recommendations
  getRecommendations(tier: SubscriptionTier): string[] {
    const recommendations: string[] = [];

    if (tier === 'free') {
      recommendations.push('Considere upgrade para Pro para dados mais atualizados');
      recommendations.push('Cache mais agressivo aplicado para otimizar custos');
      recommendations.push('Algumas requisições podem ter atraso de até 30 minutos');
    } else if (tier === 'pro') {
      recommendations.push('Upgrade para Premium desbloqueia dados em tempo real');
      recommendations.push('Batch requests ativo para reduzir consumo de API');
    } else {
      recommendations.push('Acesso premium: dados em tempo real habilitados');
      recommendations.push('Cache mínimo para máxima atualização');
    }

    return recommendations;
  }
}

export const ApiCostOptimizer = ApiCostOptimizerClass.getInstance();
