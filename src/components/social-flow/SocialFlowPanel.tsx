
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, Twitter, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SocialMentionsData } from '@/types/social';
import SocialMentionCard from './SocialMentionCard';
import SocialMentionsChart from './SocialMentionsChart';
import { getMockSocialMentionsData } from '@/lib/socialData';

const SocialFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');

  const { data, isLoading, error, refetch } = useQuery<SocialMentionsData>({
    queryKey: ['social-mentions', timeframe],
    queryFn: () => getMockSocialMentionsData(timeframe),
    refetchInterval: 60 * 1000 * 5, // 5 minutes
    staleTime: 60 * 1000 * 2, // 2 minutes
    meta: {
      onError: () => {
        toast.error("Failed to fetch social mentions data");
      }
    }
  });

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Social Flow
          </h2>
          <Twitter className="h-5 w-5 text-blue-400" />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Failed to load social mentions data</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Mentions ao longo do tempo
                </h3>
              </div>
              <div className="h-[300px]">
                {data?.mentionsOverTime && (
                  <SocialMentionsChart mentions={data.mentionsOverTime} />
                )}
              </div>
            </div>
            
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Sentimento de mercado
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {data?.topMentions.slice(0, 6).map((mention, index) => (
                  <div key={mention.symbol} className={`bg-gray-800/50 border ${mention.sentiment > 0 ? 'border-green-700/30' : 'border-red-700/30'} rounded-lg p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-10 rounded-full ${mention.sentiment > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="font-bold">{mention.symbol}</div>
                        <div className="text-xs text-gray-400">{mention.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`${mention.sentiment > 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                        {mention.sentiment > 0 ? '+' : ''}{mention.sentiment}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {mention.trend > 0 ? '↑' : '↓'} {Math.abs(mention.trend)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Top Menções</h3>
              <div className="space-y-3">
                {data?.topMentions.slice(0, 10).map((mention, index) => (
                  <SocialMentionCard key={mention.symbol} mention={mention} rank={index + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFlowPanel;
