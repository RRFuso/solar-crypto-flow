import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, Loader2, Zap } from 'lucide-react';

const PopulateDataButton = () => {
  const [isPopulatingHistory, setIsPopulatingHistory] = useState(false);
  const [isPopulatingWatchlist, setIsPopulatingWatchlist] = useState(false);
  const [isExpandingTokens, setIsExpandingTokens] = useState(false);

  const expandTokenCoverage = async () => {
    setIsExpandingTokens(true);
    try {
      toast.info('Expandindo cobertura de tokens...', {
        description: 'Buscando todos os tokens disponíveis na Binance'
      });

      const { data, error } = await supabase.functions.invoke('binance-all-symbols');
      
      if (error) {
        throw error;
      }

      toast.success('Cobertura de tokens expandida com sucesso!', {
        description: `${data?.totalSymbols || 0} símbolos processados, ${data?.newCryptoEntries || 0} novos tokens adicionados`
      });

    } catch (error) {
      console.error('Error expanding token coverage:', error);
      toast.error('Erro ao expandir cobertura de tokens', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsExpandingTokens(false);
    }
  };

  const populatePriceHistory = async () => {
    setIsPopulatingHistory(true);
    try {
      toast.info('Iniciando população de dados históricos...', {
        description: 'Isso pode levar alguns minutos'
      });

      const { data, error } = await supabase.functions.invoke('populate-multiple-price-history');
      
      if (error) {
        throw error;
      }

      toast.success('Dados históricos populados com sucesso!', {
        description: `${data?.records_inserted || 0} registros inseridos para ${data?.symbols_processed || 0} criptomoedas`
      });

    } catch (error) {
      console.error('Error populating price history:', error);
      toast.error('Erro ao popular dados históricos', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsPopulatingHistory(false);
    }
  };

  const populateWatchlistSignals = async () => {
    setIsPopulatingWatchlist(true);
    try {
      toast.info('Iniciando população de sinais do AI Watchlist...');

      const { data, error } = await supabase.functions.invoke('populate-watchlist-signals');
      
      if (error) {
        throw error;
      }

      toast.success('Sinais do AI Watchlist populados com sucesso!', {
        description: `${data?.entries_created || 0} entradas criadas na watchlist`
      });

    } catch (error) {
      console.error('Error populating watchlist signals:', error);
      toast.error('Erro ao popular sinais do AI Watchlist', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsPopulatingWatchlist(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
        <Database size={16} />
        População de Dados
      </h3>
      
      <Button 
        onClick={expandTokenCoverage}
        disabled={isExpandingTokens}
        variant="outline"
        size="sm"
        className="w-full justify-start"
      >
        {isExpandingTokens ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {isExpandingTokens ? 'Expandindo...' : 'Expandir Cobertura de Tokens'}
      </Button>

      <Button 
        onClick={populatePriceHistory}
        disabled={isPopulatingHistory}
        variant="outline"
        size="sm"
        className="w-full justify-start"
      >
        {isPopulatingHistory ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Database className="mr-2 h-4 w-4" />
        )}
        {isPopulatingHistory ? 'Populando...' : 'Popular Histórico de Preços'}
      </Button>

      <Button
        onClick={populateWatchlistSignals}
        disabled={isPopulatingWatchlist}
        variant="outline"
        size="sm"
        className="w-full justify-start"
      >
        {isPopulatingWatchlist ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {isPopulatingWatchlist ? 'Populando...' : 'Popular AI Watchlist'}
      </Button>

      <p className="text-xs text-gray-400 mt-2">
        <strong>1.</strong> Primeiro expanda a cobertura de tokens<br/>
        <strong>2.</strong> Depois popule o histórico de preços<br/>
        <strong>3.</strong> Por último, popule a AI Watchlist
      </p>
    </div>
  );
};

export default PopulateDataButton;