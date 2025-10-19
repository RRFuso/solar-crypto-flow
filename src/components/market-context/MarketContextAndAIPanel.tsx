import React from 'react';
import MarketRegime from './MarketRegime';
import NarrativeMaps from './NarrativeMaps';
import DailyInsights from './DailyInsights';
import { AdvancedAIDashboard } from '@/components/ai/AdvancedAIDashboard';
import { EnhancedAIInsights } from '@/components/ai/EnhancedAIInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketDataCoinGecko } from '@/lib/marketData';

export const MarketContextAndAIPanel: React.FC = () => {
  // Fetch top symbols for AI analysis
  const { data: flowData } = useQuery({
    queryKey: ['market-data-for-ai'],
    queryFn: () => fetchMarketDataCoinGecko('24h'),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const topSymbols = flowData?.slice(0, 15).map(f => f.to) || [];

  return (
    <div className="h-full w-full p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto">
      {/* Left Column */}
      <div className="space-y-4 flex flex-col">
        <MarketRegime />
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Insights de IA Avançada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedAIInsights symbols={topSymbols} />
          </CardContent>
        </Card>
        <DailyInsights />
      </div>

      {/* Right Column */}
      <div className="space-y-4 flex flex-col">
        <Card className="flex-grow h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Narrative Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div className="h-full min-h-[300px]">
              <NarrativeMaps />
            </div>
          </CardContent>
        </Card>
        <AdvancedAIDashboard />
      </div>
    </div>
  );
};

export default MarketContextAndAIPanel;
