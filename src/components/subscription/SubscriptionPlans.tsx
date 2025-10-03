import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = {
  pro: {
    name: 'Pro',
    price: 'R$ 10',
    priceId: 'price_1SEBY0L98a1SkSX47ugTNfWb',
    icon: Sparkles,
    features: [
      'Flows ilimitados',
      'AI Watchlist',
      'Análises avançadas',
      'Suporte prioritário'
    ]
  },
  premium: {
    name: 'Premium',
    price: 'R$ 50',
    priceId: 'price_1SEBYML98a1SkSX4zavuwiUj',
    icon: Crown,
    features: [
      'Todas as funcionalidades Pro',
      'AutoTrade completo',
      'Sinais explosivos em tempo real',
      'Análises on-chain',
      'Capital Flow detalhado',
      'Suporte VIP 24/7'
    ]
  }
};

export const SubscriptionPlans: React.FC = () => {
  const { subscriptionPlan, user, isSubscribed, subscriptionEnd, checkSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error('Faça login para assinar um plano');
      return;
    }

    setLoading(planName);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        
        // Check subscription after a delay to allow for checkout completion
        setTimeout(() => {
          checkSubscription();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao criar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal de gerenciamento.');
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Escolha seu Plano
        </h1>
        <p className="text-muted-foreground text-lg">
          Desbloqueie todo o potencial do SOLCRY
        </p>
        {isSubscribed && subscriptionEnd && (
          <p className="text-sm text-muted-foreground mt-2">
            Seu plano atual: <Badge variant="secondary">{subscriptionPlan.toUpperCase()}</Badge> • 
            Renovação: {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <Card className={`relative ${subscriptionPlan === 'free' ? 'border-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Free</CardTitle>
              {subscriptionPlan === 'free' && (
                <Badge variant="default">Atual</Badge>
              )}
            </div>
            <CardDescription className="text-2xl font-bold">R$ 0<span className="text-sm font-normal">/mês</span></CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Até 30 flows</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Visualização básica</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {subscriptionPlan !== 'free' && (
              <p className="text-sm text-muted-foreground text-center w-full">
                Disponível após cancelamento
              </p>
            )}
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative ${subscriptionPlan === 'pro' ? 'border-primary shadow-lg' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Pro</CardTitle>
              </div>
              {subscriptionPlan === 'pro' && (
                <Badge variant="default">Atual</Badge>
              )}
            </div>
            <CardDescription className="text-2xl font-bold">
              {PLANS.pro.price}
              <span className="text-sm font-normal">/mês</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.pro.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {subscriptionPlan === 'pro' ? (
              <Button 
                onClick={handleManageSubscription}
                disabled={managingPortal}
                variant="outline"
                className="w-full"
              >
                {managingPortal ? 'Abrindo...' : 'Gerenciar Assinatura'}
              </Button>
            ) : (
              <Button 
                onClick={() => handleSubscribe(PLANS.pro.priceId, 'pro')}
                disabled={loading === 'pro'}
                className="w-full"
              >
                {loading === 'pro' ? 'Processando...' : 'Assinar Pro'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${subscriptionPlan === 'premium' ? 'border-primary shadow-xl' : ''}`}>
          {subscriptionPlan !== 'premium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-accent">Mais Popular</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Premium</CardTitle>
              </div>
              {subscriptionPlan === 'premium' && (
                <Badge variant="default">Atual</Badge>
              )}
            </div>
            <CardDescription className="text-2xl font-bold">
              {PLANS.premium.price}
              <span className="text-sm font-normal">/mês</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.premium.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {subscriptionPlan === 'premium' ? (
              <Button 
                onClick={handleManageSubscription}
                disabled={managingPortal}
                variant="outline"
                className="w-full"
              >
                {managingPortal ? 'Abrindo...' : 'Gerenciar Assinatura'}
              </Button>
            ) : (
              <Button 
                onClick={() => handleSubscribe(PLANS.premium.priceId, 'premium')}
                disabled={loading === 'premium'}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {loading === 'premium' ? 'Processando...' : 'Assinar Premium'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {isSubscribed && (
        <div className="text-center mt-8">
          <Button 
            onClick={handleManageSubscription}
            disabled={managingPortal}
            variant="ghost"
          >
            {managingPortal ? 'Abrindo portal...' : 'Gerenciar minha assinatura'}
          </Button>
        </div>
      )}
    </div>
  );
};
