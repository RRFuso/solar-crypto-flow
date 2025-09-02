import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketRegime from './MarketRegime';
import NarrativeMaps from './NarrativeMaps';
import DailyInsights from './DailyInsights';
import { AdvancedAIDashboard } from '@/components/ai/AdvancedAIDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp } from 'lucide-react';

export const MarketContextAndAIPanel: React.FC = () => {
  return (
    <div className="h-full w-full p-4">
      <Tabs defaultValue="overview" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="narratives">Narratives</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              <div className="lg:col-span-1 space-y-4">
                <MarketRegime />
                <Card>
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
              </div>
              <div className="lg:col-span-2">
                <DailyInsights />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="h-full">
            <div className="h-full">
              <AdvancedAIDashboard />
            </div>
          </TabsContent>

          <TabsContent value="narratives" className="h-full">
            <div className="grid grid-cols-1 gap-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Narrative Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NarrativeMaps />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MarketContextAndAIPanel;