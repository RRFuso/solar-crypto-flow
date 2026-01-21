import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CryptoLogo from './CryptoLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Fish } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WhaleFlowData {
  token_symbol: string;
  net_flow_usd: number;
  total_inflow_usd: number;
  total_outflow_usd: number;
  whale_tx_count: number;
  dominant_direction: 'bullish' | 'bearish' | 'neutral';
  confidence_score: number;
  last_updated: string;
}

interface WhalePanelProps {
  maxItems?: number;
}

const WhalePanel: React.FC<WhalePanelProps> = ({ maxItems = 10 }) => {
  const { data: whaleFlows, isLoading, error } = useQuery({
    queryKey: ['whale-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_money_flow_cache')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(maxItems);
      
      if (error) throw error;
      return data as WhaleFlowData[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  const formatUSD = (value: number) => {
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
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

  if (isLoading) {
    return (
      <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full">
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-white text-base font-semibold flex items-center gap-2">
            🐋 Whale Panel
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

  if (error || !whaleFlows) {
    return (
      <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full p-4">
        <div className="text-center text-gray-400">
          <Fish className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum dado de baleias disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-white text-base font-semibold flex items-center gap-2">
          🐋 Whale Panel
          <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full">
            Smart Money
          </span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Top 10 ativos com maior atividade de baleias (24h)
        </p>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {whaleFlows.map((flow, index) => {
          const totalFlow = flow.total_inflow_usd + flow.total_outflow_usd;
          const inflowPercent = totalFlow > 0 ? (flow.total_inflow_usd / totalFlow) * 100 : 50;
          
          return (
            <div
              key={flow.token_symbol}
              className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-white border border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <CryptoLogo
                    symbol={flow.token_symbol}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <span className="absolute -top-1 -left-1 bg-blue-600 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{flow.token_symbol}</span>
                    <div className={`flex items-center gap-1 ${getSentimentColor(flow.dominant_direction)}`}>
                      {flow.dominant_direction === 'bullish' ? 
                        <ArrowUpRight size={14} /> : 
                        flow.dominant_direction === 'bearish' ?
                        <ArrowDownRight size={14} /> : null
                      }
                      <span className="text-xs font-medium">
                        {getSentimentLabel(flow.dominant_direction)}
                      </span>
                    </div>
                  </div>

                  {/* Net Whale Volume */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Net Volume:</span>
                      <span className={flow.net_flow_usd >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {flow.net_flow_usd >= 0 ? '+' : ''}{formatUSD(flow.net_flow_usd)}
                      </span>
                    </div>
                  </div>

                  {/* Inflow vs Outflow Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Inflow: ${formatUSD(flow.total_inflow_usd)}</span>
                      <span>Outflow: ${formatUSD(flow.total_outflow_usd)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
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

                  {/* Whale TX Count */}
                  <div className="mt-2 flex justify-between items-center text-xs">
                    <span className="text-gray-400">
                      🐋 {flow.whale_tx_count} transações
                    </span>
                    <span className="text-gray-400">
                      Confiança: <span className="text-white font-medium">{Math.round(flow.confidence_score)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-700">
        <p className="text-[10px] text-gray-500 text-center">
          ⚠️ Dados informativos. Não constitui aconselhamento financeiro.
        </p>
      </div>
    </div>
  );
};

export default WhalePanel;
