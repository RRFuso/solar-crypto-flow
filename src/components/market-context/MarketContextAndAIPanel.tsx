import React from 'react';
import MarketRegime from './MarketRegime';
import NarrativeMaps from './NarrativeMaps';
import DailyInsights from './DailyInsights';
import { AdvancedAIDashboard } from '@/components/ai/AdvancedAIDashboard';
import ModernAIChatPanel from '@/components/ai/ModernAIChatPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp } from 'lucide-react';

export const MarketContextAndAIPanel: React.FC = () => {
  return (
    <div className="h-full w-full p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
      {/* Left Column */}
      <div className="space-y-4 flex flex-col">
        <MarketRegime />
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Sentiment</span>
                <span className="font-medium">Neutral</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volatility</span>
                <span className="font-medium text-orange-500">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flow Direction</span>
                <span className="font-medium text-green-500">Bullish</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <DailyInsights />
      </div>

      {/* Middle Column - AI Chat */}
      <div className="space-y-4 flex flex-col">
        <ModernAIChatPanel />
      </div>

      {/* Right Column */}
      <div className="xl:col-span-1 lg:col-span-2 xl:col-span-1 space-y-4 flex flex-col">
        <Card className="flex-grow">
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
