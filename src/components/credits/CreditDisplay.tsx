import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { Coins, Infinity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CreditDisplayProps {
  onUpgradeClick?: () => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ onUpgradeClick }) => {
  const { user, subscriptionPlan } = useAuth();
  const { credits, loading, hasUnlimitedAccess } = useCredits();

  if (loading) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-muted-foreground animate-pulse" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasUnlimitedAccess()) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Infinity className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Acesso Ilimitado</span>
                <span className="text-xs text-muted-foreground">Plano {subscriptionPlan.toUpperCase()}</span>
              </div>
            </div>
            <Badge variant="default" className="bg-primary/20 text-primary">
              Premium
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Flows: 0/30</span>
                <span className="text-xs text-muted-foreground">Faça login para expandir</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onUpgradeClick}>
              Cadastrar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {credits?.credits || 0} Créditos
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Flows: {credits?.flows_used || 0}/{credits?.flows_limit || 30}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Plano Free</span>
            </div>
          </div>
          <Button size="sm" variant="default" onClick={onUpgradeClick}>
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};