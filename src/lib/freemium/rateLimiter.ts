// ========== RATE LIMITER ==========
// Token bucket rate limiter for API requests per tier

import { SubscriptionTier, getTierConfig } from './tierConfig';

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitState {
  minute: RateLimitBucket;
  hour: RateLimitBucket;
  day: RateLimitBucket;
}

class RateLimiterClass {
  private static instance: RateLimiterClass;
  private userLimits: Map<string, RateLimitState> = new Map();
  private readonly MINUTE_MS = 60 * 1000;
  private readonly HOUR_MS = 60 * 60 * 1000;
  private readonly DAY_MS = 24 * 60 * 60 * 1000;

  private constructor() {
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  static getInstance(): RateLimiterClass {
    if (!RateLimiterClass.instance) {
      RateLimiterClass.instance = new RateLimiterClass();
    }
    return RateLimiterClass.instance;
  }

  // Initialize or get user's rate limit state
  private getOrCreateState(userId: string, tier: SubscriptionTier): RateLimitState {
    const existing = this.userLimits.get(userId);
    if (existing) return existing;

    const config = getTierConfig(tier);
    const now = Date.now();

    const newState: RateLimitState = {
      minute: { tokens: config.limits.apiRequestsPerMinute, lastRefill: now },
      hour: { tokens: config.limits.apiRequestsPerHour, lastRefill: now },
      day: { tokens: config.limits.apiRequestsPerDay, lastRefill: now },
    };

    this.userLimits.set(userId, newState);
    return newState;
  }

  // Refill tokens based on time elapsed
  private refillBucket(
    bucket: RateLimitBucket,
    maxTokens: number,
    refillIntervalMs: number
  ): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const refillCount = Math.floor(elapsed / refillIntervalMs);

    if (refillCount > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + refillCount * maxTokens);
      bucket.lastRefill = now - (elapsed % refillIntervalMs);
    }
  }

  // Check if request can proceed and consume token
  canMakeRequest(
    userId: string,
    tier: SubscriptionTier,
    tokensRequired: number = 1
  ): { allowed: boolean; retryAfterMs?: number; reason?: string } {
    const config = getTierConfig(tier);
    const state = this.getOrCreateState(userId, tier);
    const now = Date.now();

    // Refill all buckets
    this.refillBucket(state.minute, config.limits.apiRequestsPerMinute, this.MINUTE_MS);
    this.refillBucket(state.hour, config.limits.apiRequestsPerHour, this.HOUR_MS);
    this.refillBucket(state.day, config.limits.apiRequestsPerDay, this.DAY_MS);

    // Check minute limit
    if (state.minute.tokens < tokensRequired) {
      const retryAfter = this.MINUTE_MS - (now - state.minute.lastRefill);
      return {
        allowed: false,
        retryAfterMs: retryAfter,
        reason: 'Limite de requisições por minuto atingido',
      };
    }

    // Check hour limit
    if (state.hour.tokens < tokensRequired) {
      const retryAfter = this.HOUR_MS - (now - state.hour.lastRefill);
      return {
        allowed: false,
        retryAfterMs: retryAfter,
        reason: 'Limite de requisições por hora atingido',
      };
    }

    // Check day limit
    if (state.day.tokens < tokensRequired) {
      const retryAfter = this.DAY_MS - (now - state.day.lastRefill);
      return {
        allowed: false,
        retryAfterMs: retryAfter,
        reason: 'Limite diário de requisições atingido',
      };
    }

    // Consume tokens
    state.minute.tokens -= tokensRequired;
    state.hour.tokens -= tokensRequired;
    state.day.tokens -= tokensRequired;

    return { allowed: true };
  }

  // Get current usage stats
  getUsageStats(userId: string, tier: SubscriptionTier): {
    minute: { used: number; limit: number; remaining: number };
    hour: { used: number; limit: number; remaining: number };
    day: { used: number; limit: number; remaining: number };
  } {
    const config = getTierConfig(tier);
    const state = this.getOrCreateState(userId, tier);

    // Refill before reporting
    this.refillBucket(state.minute, config.limits.apiRequestsPerMinute, this.MINUTE_MS);
    this.refillBucket(state.hour, config.limits.apiRequestsPerHour, this.HOUR_MS);
    this.refillBucket(state.day, config.limits.apiRequestsPerDay, this.DAY_MS);

    return {
      minute: {
        used: config.limits.apiRequestsPerMinute - state.minute.tokens,
        limit: config.limits.apiRequestsPerMinute,
        remaining: state.minute.tokens,
      },
      hour: {
        used: config.limits.apiRequestsPerHour - state.hour.tokens,
        limit: config.limits.apiRequestsPerHour,
        remaining: state.hour.tokens,
      },
      day: {
        used: config.limits.apiRequestsPerDay - state.day.tokens,
        limit: config.limits.apiRequestsPerDay,
        remaining: state.day.tokens,
      },
    };
  }

  // Reset user's limits (e.g., when they upgrade)
  resetLimits(userId: string): void {
    this.userLimits.delete(userId);
  }

  // Cleanup old entries
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, state] of this.userLimits.entries()) {
      if (now - state.day.lastRefill > maxAge) {
        this.userLimits.delete(userId);
      }
    }
  }
}

export const RateLimiter = RateLimiterClass.getInstance();
