// ========== FREEMIUM TIER CONFIGURATION ==========
// Defines access levels, limits, and features for each subscription tier

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface TierLimits {
  // Flow visualization limits
  maxFlows: number;
  flowRefreshIntervalMs: number;
  
  // Smart Money data
  smartMoneyDelayMs: number;      // Delay for smart money data (0 = real-time)
  maxWatchlistItems: number;
  confidenceScoreAccess: boolean;  // Access to detailed confidence scores
  
  // API rate limits
  apiRequestsPerMinute: number;
  apiRequestsPerHour: number;
  apiRequestsPerDay: number;
  
  // Features
  hasAIAnalyst: boolean;
  hasAlerts: boolean;
  hasHistoricalData: boolean;
  historicalDataDays: number;
  hasExportFeature: boolean;
  
  // Cache TTLs (longer for free = less API calls)
  priceCacheTTL: number;
  flowCacheTTL: number;
  onChainCacheTTL: number;
}

export interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  priceId: string | null;
  productId: string | null;
  monthlyPrice: number;
  limits: TierLimits;
  features: string[];
}

// Stripe product/price IDs
export const STRIPE_PRODUCTS = {
  pro: {
    priceId: 'price_1SEBY0L98a1SkSX47ugTNfWb',
    productId: 'prod_TAWbWItNwiXKDF',
  },
  premium: {
    priceId: 'price_1SEBYML98a1SkSX4zavuwiUj',
    productId: 'prod_TAWbSzcetW1egF',
  },
};

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Gratuito',
    description: 'Acesso básico à visualização de fluxos',
    priceId: null,
    productId: null,
    monthlyPrice: 0,
    limits: {
      maxFlows: 30,
      flowRefreshIntervalMs: 60000, // 1 minute refresh
      smartMoneyDelayMs: 30 * 60 * 1000, // 30 minutes delay
      maxWatchlistItems: 5,
      confidenceScoreAccess: false,
      apiRequestsPerMinute: 10,
      apiRequestsPerHour: 100,
      apiRequestsPerDay: 500,
      hasAIAnalyst: false,
      hasAlerts: false,
      hasHistoricalData: false,
      historicalDataDays: 0,
      hasExportFeature: false,
      priceCacheTTL: 120000,     // 2 minutes
      flowCacheTTL: 300000,      // 5 minutes  
      onChainCacheTTL: 1800000,  // 30 minutes
    },
    features: [
      'Visualização básica de fluxos',
      'Até 30 ativos',
      'Dados com atraso de 30 min',
      'Watchlist com 5 ativos',
    ],
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: 'Dados em tempo real e acesso ao AI Analyst',
    priceId: STRIPE_PRODUCTS.pro.priceId,
    productId: STRIPE_PRODUCTS.pro.productId,
    monthlyPrice: 29.90,
    limits: {
      maxFlows: 500,
      flowRefreshIntervalMs: 15000, // 15 seconds refresh
      smartMoneyDelayMs: 5 * 60 * 1000, // 5 minutes delay
      maxWatchlistItems: 50,
      confidenceScoreAccess: true,
      apiRequestsPerMinute: 60,
      apiRequestsPerHour: 1000,
      apiRequestsPerDay: 10000,
      hasAIAnalyst: true,
      hasAlerts: true,
      hasHistoricalData: true,
      historicalDataDays: 30,
      hasExportFeature: true,
      priceCacheTTL: 30000,      // 30 seconds
      flowCacheTTL: 60000,       // 1 minute
      onChainCacheTTL: 300000,   // 5 minutes
    },
    features: [
      'Até 500 ativos',
      'Dados com atraso de 5 min',
      'Watchlist com 50 ativos',
      'AI Analyst',
      'Alertas personalizados',
      '30 dias de histórico',
      'Exportação de dados',
    ],
  },
  premium: {
    name: 'premium',
    displayName: 'Premium',
    description: 'Acesso completo com dados em tempo real',
    priceId: STRIPE_PRODUCTS.premium.priceId,
    productId: STRIPE_PRODUCTS.premium.productId,
    monthlyPrice: 79.90,
    limits: {
      maxFlows: 2000,
      flowRefreshIntervalMs: 5000, // 5 seconds refresh
      smartMoneyDelayMs: 0, // Real-time
      maxWatchlistItems: 200,
      confidenceScoreAccess: true,
      apiRequestsPerMinute: 120,
      apiRequestsPerHour: 5000,
      apiRequestsPerDay: 50000,
      hasAIAnalyst: true,
      hasAlerts: true,
      hasHistoricalData: true,
      historicalDataDays: 365,
      hasExportFeature: true,
      priceCacheTTL: 10000,      // 10 seconds
      flowCacheTTL: 30000,       // 30 seconds
      onChainCacheTTL: 60000,    // 1 minute
    },
    features: [
      'Ativos ilimitados',
      'Dados em tempo real',
      'Watchlist ilimitada',
      'AI Analyst avançado',
      'Alertas ilimitados',
      '1 ano de histórico',
      'Exportação avançada',
      'Suporte prioritário',
    ],
  },
};

// Helper function to get tier config
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier] || TIER_CONFIGS.free;
}

// Helper function to get tier by product ID
export function getTierByProductId(productId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(TIER_CONFIGS)) {
    if (config.productId === productId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}

// Helper function to check if user has access to a feature
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const limits = TIER_CONFIGS[tier]?.limits;
  if (!limits) return false;
  
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return true;
}
