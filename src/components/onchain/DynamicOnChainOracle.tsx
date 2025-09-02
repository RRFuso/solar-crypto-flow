import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketDataCoinGecko } from '@/lib/marketData';
import { OnChainInsightsPanel } from './OnChainInsightsPanel';
import { OnChainTestButton } from './OnChainTestButton';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const DynamicOnChainOracle: React.FC = () => {
  const [trackedSymbols, setTrackedSymbols] = useState<string[]>([]);
  const { requestOnChainData } = useOnChainData();

  // Fetch capital flow data to get the symbols in spotlight
  const { data: flowData, isLoading: isLoadingFlow } = useQuery({
    queryKey: ['capital-flow', '24h'],
    queryFn: () => fetchMarketDataCoinGecko('24h'),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (flowData && flowData.length > 0) {
      // Extract unique symbols from flow data (the ones in the spotlight)
      const symbols = [...new Set([
        ...flowData.map(flow => flow.from),
        ...flowData.map(flow => flow.to)
      ])].filter(symbol => symbol && symbol.length > 0);
      
      // Get top symbols by volume/importance (limit to 8 for better performance)
      const sortedSymbols = [...symbols]
        .sort((a, b) => {
          const flowA = flowData.find(f => f.from === a || f.to === a);
          const flowB = flowData.find(f => f.from === b || f.to === b);
          return Math.abs(flowB?.value || 0) - Math.abs(flowA?.value || 0);
        })
        .slice(0, 8);
      
      setTrackedSymbols(sortedSymbols);
      
      // Request on-chain data for these symbols
      if (sortedSymbols.length > 0) {
        requestOnChainData(sortedSymbols);
      }
    }
  }, [flowData, requestOnChainData]);

  if (isLoadingFlow) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Identificando moedas em destaque no Capital Flow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            ⚡ Oráculo On-Chain - Capital Flow
          </h2>
          <p className="text-muted-foreground mt-2">
            Rastreando moedas em destaque no sistema solar • Dados reais via Etherscan + Dune + CoinGecko
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Moedas rastreadas:</span>
            <div className="flex flex-wrap gap-1">
              {trackedSymbols.map(symbol => (
                <span key={symbol} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        <OnChainTestButton />
      </div>
      
      {trackedSymbols.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Aguardando dados do Capital Flow para identificar moedas em destaque...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trackedSymbols.map(symbol => (
            <OnChainInsightsPanel key={symbol} symbol={symbol} />
          ))}
        </div>
      )}
    </div>
  );
};