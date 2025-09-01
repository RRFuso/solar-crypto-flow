import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { triggerBatchUpdate } from '@/services/onchain-oracle';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OnChainTestButton: React.FC = () => {
  const { requestOnChainData } = useOnChainData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testOnChainData = async () => {
    setLoading(true);
    
    try {
      toast({
        title: "🔄 Iniciando coleta de dados on-chain",
        description: "Integrando Etherscan + Dune + CoinGecko...",
      });

      // Test single symbol first
      await requestOnChainData(['ETH']);
      
      // Then test batch
      await requestOnChainData(['BTC', 'USDT', 'BNB', 'ADA']);

      toast({
        title: "✅ Dados on-chain coletados com sucesso",
        description: "Oracle funcionando com dados reais das APIs",
      });

    } catch (error) {
      console.error('Error testing on-chain data:', error);
      toast({
        title: "❌ Erro ao coletar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFullBatchUpdate = async () => {
    setLoading(true);
    
    try {
      toast({
        title: "🚀 Executando atualização completa",
        description: "Atualizando todos os símbolos rastreados...",
      });

      const success = await triggerBatchUpdate();
      
      if (success) {
        toast({
          title: "✅ Atualização completa realizada",
          description: "Todos os dados foram atualizados com dados reais",
        });
      } else {
        throw new Error('Falha na atualização batch');
      }

    } catch (error) {
      console.error('Error in batch update:', error);
      toast({
        title: "❌ Erro na atualização batch",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={testOnChainData}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? (
          <Activity className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Testar Oracle
      </Button>

      <Button 
        onClick={triggerFullBatchUpdate}
        disabled={loading}
        size="sm"
      >
        {loading ? (
          <Activity className="h-4 w-4 animate-spin" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        Atualização Completa
      </Button>
    </div>
  );
};