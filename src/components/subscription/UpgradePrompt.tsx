import React from 'react';
import { Crown, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UpgradePromptProps {
  feature: string;
  onUpgradeClick: () => void;
  requiresLogin?: boolean;
  onLoginClick?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  feature, 
  onUpgradeClick,
  requiresLogin = false,
  onLoginClick
}) => {
  if (requiresLogin) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Faça Login para Continuar</CardTitle>
          <CardDescription>
            Crie sua conta gratuitamente e ganhe 30 créditos extras para expandir seus flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <ul className="space-y-2 text-left text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              30 créditos extras ao se cadastrar
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Acesso ao Whale Galaxy
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Solar Core e Helius Oracle
            </li>
          </ul>
          <Button onClick={onLoginClick} className="w-full" size="lg">
            Criar Conta Grátis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Upgrade para Acessar {feature}</CardTitle>
        <CardDescription>
          Desbloqueie recursos ilimitados e acesso ao Helius Oracle com um plano pago.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-center">
        <ul className="space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Flows ilimitados
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Whale Galaxy completo
          </li>
          <li className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Helius Oracle exclusivo
          </li>
        </ul>
        <Button onClick={onUpgradeClick} className="w-full" size="lg">
          Ver Planos
        </Button>
      </CardContent>
    </Card>
  );
};