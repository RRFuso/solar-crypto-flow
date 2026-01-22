import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CryptoLogo from './CryptoLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Fish, RefreshCw, Loader2, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface WhaleFlowData {
  token_symbol: string;
  net_flow_usd: number;
  total_inflow_usd: number;
  total_outflow_usd: number;
  whale_tx_count: number;
  dominant_direction: 'bullish' | 'bearish' | 'neutral';
  confidence_score: number;
  last_updated: string;
  timeframe: string;
}

interface WhaleGalaxyPanelProps {
  maxItems?: number;
}

type TimeframeOption = '1h' | '4h' | '12h' | '24h';

const TIMEFRAME_OPTIONS: { value: TimeframeOption; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '12h', label: '12H' },
  { value: '24h', label: '24H' },
];

const WhaleGalaxyPanel: React.FC<WhaleGalaxyPanelProps> = ({ maxItems = 15 }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('24h');
  const queryClient = useQueryClient();

  // Query for whale flows - try with timeframe first, fallback to all data
  const { data: whaleFlows, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['whale-galaxy-flows', selectedTimeframe],
    queryFn: async () => {
      // First try with timeframe filter
      let { data, error } = await supabase
        .from('smart_money_flow_cache')
        .select('*')
        .eq('timeframe', selectedTimeframe)
        .order('net_flow_usd', { ascending: false })
        .limit(maxItems);
      
      if (error) throw error;
      
      // If no data with timeframe, get all available data
      if (!data || data.length === 0) {
        const { data: allData, error: allError } = await supabase
          .from('smart_money_flow_cache')
          .select('*')
          .order('net_flow_usd', { ascending: false })
          .limit(maxItems);
        
        if (allError) throw allError;
        data = allData;
      }
      
      return data as WhaleFlowData[];
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  // Mutation to trigger data update
  const updateFlowsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-money-tracker', {
        body: { action: 'update_flows', timeframe: selectedTimeframe }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Dados atualizados! ${data?.processed?.transactions || 0} transações processadas.`);
      queryClient.invalidateQueries({ queryKey: ['whale-galaxy-flows'] });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar dados. Tente novamente.');
    }
  });

  const formatUSD = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (absValue >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(2);
  };

  const getSentimentColor = (direction: string) => {
    if (direction === 'bullish') return 'text-green-400';
    if (direction === 'bearish') return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentLabel = (direction: string) => {
    if (direction === 'bullish') return 'Bullish';
    if (direction === 'bearish') return 'Bearish';
    return 'Neutral';
  };

  const getNetFlowColor = (netFlow: number) => {
    if (netFlow > 0) return 'text-green-400';
    if (netFlow < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getNetFlowBg = (netFlow: number) => {
    if (netFlow > 0) return 'bg-green-500/10 border-green-500/30';
    if (netFlow < 0) return 'bg-red-500/10 border-red-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  if (isLoading) {
    return (
      <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full">
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-white text-base font-semibold flex items-center gap-2">
            🐋 Whale Galaxy
          </h2>
        </div>
        <div className="p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sort by absolute net flow to show biggest movements first
  const sortedFlows = whaleFlows 
    ? [...whaleFlows].sort((a, b) => Math.abs(b.net_flow_usd) - Math.abs(a.net_flow_usd))
    : [];

  const hasNoData = !whaleFlows || whaleFlows.length === 0;

  return (
    <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-base font-semibold flex items-center gap-2">
            🐋 Whale Galaxy
            <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full">
              Smart Money
            </span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateFlowsMutation.mutate()}
              disabled={updateFlowsMutation.isPending}
              className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-colors disabled:opacity-50"
              title="Buscar dados on-chain"
            >
              {updateFlowsMutation.isPending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Atualizar visualização"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as TimeframeOption)}>
          <TabsList className="grid grid-cols-4 w-full bg-gray-800/50 p-1">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <TabsTrigger
                key={tf.value}
                value={tf.value}
                className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
              >
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="text-xs text-gray-400 mt-2">
          Top ativos por Net Whale Volume ({selectedTimeframe.toUpperCase()})
        </p>
      </div>

      {/* Flow List or Empty State */}
      <div className="flex-1 p-3 overflow-y-auto">
        {hasNoData ? (
          <div className="text-center text-gray-400 py-8">
            <Fish className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-3">Nenhum dado on-chain disponível</p>
            <button
              onClick={() => updateFlowsMutation.mutate()}
              disabled={updateFlowsMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {updateFlowsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando dados...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Buscar Smart Money Data
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Clique para buscar transações de baleias da blockchain
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFlows.map((flow, index) => {
              const totalFlow = flow.total_inflow_usd + flow.total_outflow_usd;
              const inflowPercent = totalFlow > 0 ? (flow.total_inflow_usd / totalFlow) * 100 : 50;
              const isPositiveNet = flow.net_flow_usd >= 0;
              
              return (
                <div
                  key={`${flow.token_symbol}-${flow.timeframe}`}
                  className={`rounded-lg p-3 hover:bg-gray-700/50 transition-colors text-white border ${getNetFlowBg(flow.net_flow_usd)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <CryptoLogo
                        symbol={flow.token_symbol}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <span className={`absolute -top-1 -left-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isPositiveNet ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{flow.token_symbol}</span>
                          <div className={`flex items-center gap-0.5 ${getSentimentColor(flow.dominant_direction)}`}>
                            {flow.dominant_direction === 'bullish' ? 
                              <ArrowUpRight size={12} /> : 
                              flow.dominant_direction === 'bearish' ?
                              <ArrowDownRight size={12} /> : null
                            }
                            <span className="text-[10px] font-medium">
                              {getSentimentLabel(flow.dominant_direction)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                          {flow.timeframe}
                        </span>
                      </div>

                      {/* Net Whale Volume - Prominent */}
                      <div className={`text-lg font-bold mb-2 ${getNetFlowColor(flow.net_flow_usd)}`}>
                        {isPositiveNet ? '+' : ''}{formatUSD(flow.net_flow_usd)}
                        <span className="text-xs font-normal text-gray-400 ml-1">Net</span>
                      </div>

                      {/* Inflow vs Outflow Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span className="text-green-400">↑ ${formatUSD(flow.total_inflow_usd)}</span>
                          <span className="text-red-400">↓ ${formatUSD(flow.total_outflow_usd)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${inflowPercent}%` }}
                          />
                          <div 
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${100 - inflowPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400">
                        <span>
                          🐋 {flow.whale_tx_count} txs
                        </span>
                        <span>
                          Conf: <span className="text-white font-medium">{Math.round(flow.confidence_score)}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-2 border-t border-gray-700">
        <p className="text-[10px] text-gray-500 text-center">
          ⚠️ Dados on-chain informativos. Não constitui aconselhamento financeiro.
        </p>
      </div>
    </div>
  );
};

export default WhaleGalaxyPanel;
