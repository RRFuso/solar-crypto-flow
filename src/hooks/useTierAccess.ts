// ========== TIER ACCESS HOOK ==========
// Hook for checking tier-based access and enforcing limits

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { 
  SubscriptionTier, 
  getTierConfig, 
  hasFeatureAccess,
  TierLimits 
} from '@/lib/freemium/tierConfig';
import { RateLimiter } from '@/lib/freemium/rateLimiter';
import { toast } from 'sonner';

export interface TierAccessResult {
  // Current tier info
  tier: SubscriptionTier;
  tierName: string;
  isAdmin: boolean;
  
  // Limits
  limits: TierLimits;
  
  // Access checks
  canAccessFlow: (flowCount: number) => boolean;
  canAccessSmartMoney: () => boolean;
  canAccessAIAnalyst: () => boolean;
  canAccessAlerts: () => boolean;
  canAccessHistoricalData: () => boolean;
  canExportData: () => boolean;
  canAccessConfidenceScore: () => boolean;
  
  // Rate limiting
  canMakeApiRequest: (tokensRequired?: number) => boolean;
  getApiUsageStats: () => ReturnType<typeof RateLimiter.getUsageStats>;
  
  // Smart money delay
  getSmartMoneyDelay: () => number;
  
  // Cache TTLs
  getCacheTTL: (cacheType: 'price' | 'flow' | 'onChain') => number;
  
  // Upgrade prompts
  showUpgradePrompt: (feature: string) => void;
}

export function useTierAccess(): TierAccessResult {
  const { user, subscriptionPlan } = useAuth();
  const { isAdmin } = useCredits();

  // Determine current tier
  const tier: SubscriptionTier = useMemo(() => {
    if (isAdmin) return 'premium'; // Admins get premium access
    if (subscriptionPlan === 'premium') return 'premium';
    if (subscriptionPlan === 'pro') return 'pro';
    return 'free';
  }, [isAdmin, subscriptionPlan]);

  const tierConfig = useMemo(() => getTierConfig(tier), [tier]);
  const userId = user?.id || 'anonymous';

  // Access checks
  const canAccessFlow = useCallback((flowCount: number): boolean => {
    if (isAdmin) return true;
    return flowCount <= tierConfig.limits.maxFlows;
  }, [isAdmin, tierConfig.limits.maxFlows]);

  const canAccessSmartMoney = useCallback((): boolean => {
    // Everyone can access, but with different delays
    return true;
  }, []);

  const canAccessAIAnalyst = useCallback((): boolean => {
    if (isAdmin) return true;
    return tierConfig.limits.hasAIAnalyst;
  }, [isAdmin, tierConfig.limits.hasAIAnalyst]);

  const canAccessAlerts = useCallback((): boolean => {
    if (isAdmin) return true;
    return tierConfig.limits.hasAlerts;
  }, [isAdmin, tierConfig.limits.hasAlerts]);

  const canAccessHistoricalData = useCallback((): boolean => {
    if (isAdmin) return true;
    return tierConfig.limits.hasHistoricalData;
  }, [isAdmin, tierConfig.limits.hasHistoricalData]);

  const canExportData = useCallback((): boolean => {
    if (isAdmin) return true;
    return tierConfig.limits.hasExportFeature;
  }, [isAdmin, tierConfig.limits.hasExportFeature]);

  const canAccessConfidenceScore = useCallback((): boolean => {
    if (isAdmin) return true;
    return tierConfig.limits.confidenceScoreAccess;
  }, [isAdmin, tierConfig.limits.confidenceScoreAccess]);

  // Rate limiting
  const canMakeApiRequest = useCallback((tokensRequired: number = 1): boolean => {
    if (isAdmin) return true; // Admins bypass rate limiting
    
    const result = RateLimiter.canMakeRequest(userId, tier, tokensRequired);
    
    if (!result.allowed && result.reason) {
      console.warn(`Rate limit: ${result.reason}`);
    }
    
    return result.allowed;
  }, [userId, tier, isAdmin]);

  const getApiUsageStats = useCallback(() => {
    return RateLimiter.getUsageStats(userId, tier);
  }, [userId, tier]);

  // Smart money delay
  const getSmartMoneyDelay = useCallback((): number => {
    if (isAdmin) return 0;
    return tierConfig.limits.smartMoneyDelayMs;
  }, [isAdmin, tierConfig.limits.smartMoneyDelayMs]);

  // Cache TTLs
  const getCacheTTL = useCallback((cacheType: 'price' | 'flow' | 'onChain'): number => {
    switch (cacheType) {
      case 'price':
        return tierConfig.limits.priceCacheTTL;
      case 'flow':
        return tierConfig.limits.flowCacheTTL;
      case 'onChain':
        return tierConfig.limits.onChainCacheTTL;
      default:
        return tierConfig.limits.flowCacheTTL;
    }
  }, [tierConfig.limits]);

  // Upgrade prompt
  const showUpgradePrompt = useCallback((feature: string): void => {
    const nextTier = tier === 'free' ? 'Pro' : 'Premium';
    toast.info(`Faça upgrade para o plano ${nextTier} para acessar ${feature}`, {
      action: {
        label: 'Ver Planos',
        onClick: () => {
          // This will be handled by the component that uses this hook
          window.dispatchEvent(new CustomEvent('open-subscription-dialog'));
        },
      },
      duration: 5000,
    });
  }, [tier]);

  return {
    tier,
    tierName: tierConfig.displayName,
    isAdmin,
    limits: tierConfig.limits,
    canAccessFlow,
    canAccessSmartMoney,
    canAccessAIAnalyst,
    canAccessAlerts,
    canAccessHistoricalData,
    canExportData,
    canAccessConfidenceScore,
    canMakeApiRequest,
    getApiUsageStats,
    getSmartMoneyDelay,
    getCacheTTL,
    showUpgradePrompt,
  };
}
