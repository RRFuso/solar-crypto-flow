// API Usage Tracker - Singleton for tracking all API calls across the application

export interface ApiRequestLog {
  timestamp: Date;
  api: string;
  endpoint: string;
  cached: boolean;
  cost: number;
  responseTime?: number;
}

export interface ApiStats {
  totalRequests: number;
  cachedRequests: number;
  liveRequests: number;
  cacheHitRate: number;
  totalCost: number;
  estimatedCostWithoutCache: number;
  savings: number;
  savingsPercentage: number;
}

export interface ApiMetrics {
  requests: number;
  cached: number;
  live: number;
  cacheHitRate: number;
  cost: number;
  avgResponseTime: number;
}

// Cost per request for each API (in USD)
const API_COSTS: Record<string, number> = {
  coingecko: 0.00001,      // Free tier, minimal cost attribution
  binance: 0,              // Free API
  etherscan: 0.0005,       // ~$0.0005 per request
  dune: 0.001,             // Dune Analytics
  coinglass: 0.0002,       // CoinGlass
  defillama: 0,            // Free API
  websocket: 0,            // WebSocket connections are free
};

class ApiUsageTrackerClass {
  private static instance: ApiUsageTrackerClass;
  private logs: ApiRequestLog[] = [];
  private sessionStart: Date;
  private maxLogs = 10000; // Prevent memory bloat

  private constructor() {
    this.sessionStart = new Date();
    this.loadFromStorage();
  }

  static getInstance(): ApiUsageTrackerClass {
    if (!ApiUsageTrackerClass.instance) {
      ApiUsageTrackerClass.instance = new ApiUsageTrackerClass();
    }
    return ApiUsageTrackerClass.instance;
  }

  // Track a request
  trackRequest(
    api: string,
    endpoint: string,
    cached: boolean,
    responseTime?: number
  ): void {
    const cost = cached ? 0 : (API_COSTS[api.toLowerCase()] || 0);
    
    const log: ApiRequestLog = {
      timestamp: new Date(),
      api: api.toLowerCase(),
      endpoint,
      cached,
      cost,
      responseTime,
    };

    this.logs.push(log);

    // Trim old logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveToStorage();
  }

  // Track custom cost
  trackCost(api: string, cost: number): void {
    const lastLog = this.logs.find(
      (l) => l.api === api.toLowerCase() && !l.cached
    );
    if (lastLog) {
      lastLog.cost = cost;
      this.saveToStorage();
    }
  }

  // Get overall stats
  getStats(period?: '1h' | '24h' | '7d' | '30d'): ApiStats {
    const filteredLogs = this.filterByPeriod(period);
    
    const totalRequests = filteredLogs.length;
    const cachedRequests = filteredLogs.filter((l) => l.cached).length;
    const liveRequests = totalRequests - cachedRequests;
    const cacheHitRate = totalRequests > 0 ? cachedRequests / totalRequests : 0;
    
    const totalCost = filteredLogs.reduce((sum, l) => sum + l.cost, 0);
    const estimatedCostWithoutCache = filteredLogs.reduce(
      (sum, l) => sum + (API_COSTS[l.api] || 0),
      0
    );
    const savings = estimatedCostWithoutCache - totalCost;
    const savingsPercentage = estimatedCostWithoutCache > 0 
      ? (savings / estimatedCostWithoutCache) * 100 
      : 0;

    return {
      totalRequests,
      cachedRequests,
      liveRequests,
      cacheHitRate,
      totalCost,
      estimatedCostWithoutCache,
      savings,
      savingsPercentage,
    };
  }

  // Get stats by API
  getStatsByApi(period?: '1h' | '24h' | '7d' | '30d'): Record<string, ApiMetrics> {
    const filteredLogs = this.filterByPeriod(period);
    const byApi: Record<string, ApiMetrics> = {};

    for (const log of filteredLogs) {
      if (!byApi[log.api]) {
        byApi[log.api] = {
          requests: 0,
          cached: 0,
          live: 0,
          cacheHitRate: 0,
          cost: 0,
          avgResponseTime: 0,
        };
      }

      byApi[log.api].requests++;
      if (log.cached) {
        byApi[log.api].cached++;
      } else {
        byApi[log.api].live++;
      }
      byApi[log.api].cost += log.cost;
    }

    // Calculate derived metrics
    for (const api of Object.keys(byApi)) {
      const metrics = byApi[api];
      metrics.cacheHitRate = metrics.requests > 0 
        ? metrics.cached / metrics.requests 
        : 0;
      
      const logsWithTime = filteredLogs.filter(
        (l) => l.api === api && l.responseTime !== undefined
      );
      metrics.avgResponseTime = logsWithTime.length > 0
        ? logsWithTime.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logsWithTime.length
        : 0;
    }

    return byApi;
  }

  // Get recent logs
  getRecentLogs(count: number = 100): ApiRequestLog[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
    this.sessionStart = new Date();
    this.saveToStorage();
  }

  // Get session duration in minutes
  getSessionDuration(): number {
    return (Date.now() - this.sessionStart.getTime()) / 60000;
  }

  private filterByPeriod(period?: '1h' | '24h' | '7d' | '30d'): ApiRequestLog[] {
    if (!period) return this.logs;

    const now = Date.now();
    const msMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - msMap[period];
    return this.logs.filter((l) => l.timestamp.getTime() >= cutoff);
  }

  private saveToStorage(): void {
    try {
      const data = {
        logs: this.logs.slice(-1000), // Only persist last 1000
        sessionStart: this.sessionStart.toISOString(),
      };
      localStorage.setItem('api_usage_tracker', JSON.stringify(data));
    } catch (e) {
      // localStorage might be full or unavailable
      console.warn('Failed to save API usage tracker data:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('api_usage_tracker');
      if (stored) {
        const data = JSON.parse(stored);
        this.logs = (data.logs || []).map((l: any) => ({
          ...l,
          timestamp: new Date(l.timestamp),
        }));
        this.sessionStart = new Date(data.sessionStart || Date.now());
      }
    } catch (e) {
      console.warn('Failed to load API usage tracker data:', e);
    }
  }
}

// Export singleton instance
export const ApiUsageTracker = ApiUsageTrackerClass.getInstance();
