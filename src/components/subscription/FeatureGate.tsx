import React from 'react';
import { Lock, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTierAccess } from '@/hooks/useTierAccess';
import { SubscriptionTier } from '@/lib/freemium/tierConfig';
import { cn } from '@/lib/utils';

type FeatureType = 
  | 'aiAnalyst' 
  | 'alerts' 
  | 'historicalData' 
  | 'export' 
  | 'confidenceScore'
  | 'realTimeData';

interface FeatureGateProps {
  feature: FeatureType;
  requiredTier?: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeCard?: boolean;
  onUpgrade?: () => void;
}

const featureInfo: Record<FeatureType, {
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
}> = {
  aiAnalyst: {
    name: 'AI Analyst',
    description: 'Análise inteligente com IA para identificar oportunidades',
    requiredTier: 'pro',
  },
  alerts: {
    name: 'Alertas Personalizados',
    description: 'Receba notificações quando movimentos importantes ocorrerem',
    requiredTier: 'pro',
  },
  historicalData: {
    name: 'Dados Históricos',
    description: 'Acesse o histórico completo de movimentações',
    requiredTier: 'pro',
  },
  export: {
    name: 'Exportação de Dados',
    description: 'Exporte dados em CSV ou JSON para análise externa',
    requiredTier: 'pro',
  },
  confidenceScore: {
    name: 'Confidence Score Detalhado',
    description: 'Veja os fatores que compõem o score de confiança',
    requiredTier: 'pro',
  },
  realTimeData: {
    name: 'Dados em Tempo Real',
    description: 'Acesso a dados de smart money sem atraso',
    requiredTier: 'premium',
  },
};

const tierOrder: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  fallback,
  showUpgradeCard = true,
  onUpgrade,
}) => {
  const { tier, isAdmin, showUpgradePrompt } = useTierAccess();
  
  const info = featureInfo[feature];
  const minTier = requiredTier || info.requiredTier;
  
  // Check if user has access
  const hasAccess = isAdmin || tierOrder[tier] >= tierOrder[minTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade card
  if (!showUpgradeCard) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      showUpgradePrompt(info.name);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{info.name}</CardTitle>
            <CardDescription className="text-xs">
              Disponível no plano {minTier === 'premium' ? 'Premium' : 'Pro'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {info.description}
        </p>
        <Button 
          onClick={handleUpgrade} 
          className="w-full"
          size="sm"
        >
          {minTier === 'premium' ? (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade para Premium
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Upgrade para Pro
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// HOC for feature gating
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureType,
  fallback?: React.ReactNode
): React.FC<P> {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}
