
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle, RefreshCcw, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTrendingCryptoMentions } from '@/lib/socialData';
import SocialMentionCard from './SocialMentionCard';
import SocialMentionsChart from './SocialMentionsChart';

const SocialFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');

  const { data: mentionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['social-mentions', timeframe],
    queryFn: () => getTrendingCryptoMentions(timeframe),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    meta: {
      onError: () => {
        toast.error("Falha ao carregar menções sociais");
      }
    }
  });

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Social Flow
          </h2>
          <MessageCircle className="h-5 w-5 text-purple-400" />
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última Hora</SelectItem>
              <SelectItem value="24h">24 Horas</SelectItem>
              <SelectItem value="7d">7 Dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            className="bg-white/5 border-white/10 hover:bg-white/10"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          Falha ao carregar dados
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mentionsData?.topMentions.slice(0, 3).map((mention, index) => (
              <SocialMentionCard 
                key={mention.symbol} 
                rank={index + 1}
                mention={mention}
              />
            ))}
          </div>
          
          <div className="flex-1 border border-white/10 rounded-xl bg-white/5 p-4">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              <h3 className="text-xl font-semibold">Tendência de Menções</h3>
            </div>
            <div className="h-[350px]">
              <SocialMentionsChart mentions={mentionsData?.mentionsOverTime || []} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mentionsData?.topMentions.slice(3, 11).map((mention, index) => (
              <SocialMentionCard 
                key={mention.symbol} 
                rank={index + 4}
                mention={mention}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFlowPanel;
