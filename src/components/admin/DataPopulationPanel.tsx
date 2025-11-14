
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const DataPopulationPanel: React.FC = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const invokeFunction = async (functionName: string, body?: any) => {
    setLoading(prev => ({ ...prev, [functionName]: true }));
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body || {}
      });

      if (error) throw error;

      toast.success(`${functionName} executado com sucesso!`, {
        description: data?.message || 'Dados atualizados'
      });
    } catch (error) {
      console.error(`Error invoking ${functionName}:`, error);
      toast.error(`Erro ao executar ${functionName}`, {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(prev => ({ ...prev, [functionName]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel de População de Dados</h2>
        <p className="text-muted-foreground">
          Use estas funções para popular e atualizar dados na plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Símbolos Binance</CardTitle>
            <CardDescription>
              Atualiza a lista de símbolos disponíveis na Binance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('binance-all-symbols')}
              disabled={loading['binance-all-symbols']}
              className="w-full"
            >
              {loading['binance-all-symbols'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Símbolos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criptomoedas</CardTitle>
            <CardDescription>
              Popula dados de criptomoedas do CoinGecko
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('populate-cryptocurrencies')}
              disabled={loading['populate-cryptocurrencies']}
              className="w-full"
            >
              {loading['populate-cryptocurrencies'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Popular Criptomoedas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinais de Criptomoedas</CardTitle>
            <CardDescription>
              Calcula e popula sinais técnicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('populate-crypto-signals')}
              disabled={loading['populate-crypto-signals']}
              className="w-full"
            >
              {loading['populate-crypto-signals'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Popular Sinais
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinais de Watchlist</CardTitle>
            <CardDescription>
              Atualiza sinais das moedas na watchlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('populate-watchlist-signals')}
              disabled={loading['populate-watchlist-signals']}
              className="w-full"
            >
              {loading['populate-watchlist-signals'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Watchlist
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Preços</CardTitle>
            <CardDescription>
              Popula histórico de preços múltiplos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('populate-multiple-price-history')}
              disabled={loading['populate-multiple-price-history']}
              className="w-full"
            >
              {loading['populate-multiple-price-history'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Popular Histórico
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados On-Chain</CardTitle>
            <CardDescription>
              Atualiza dados on-chain e métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => invokeFunction('onchain-oracle', {
                action: 'batch_update',
                symbols: ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC']
              })}
              disabled={loading['onchain-oracle']}
              className="w-full"
            >
              {loading['onchain-oracle'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar On-Chain
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataPopulationPanel;
