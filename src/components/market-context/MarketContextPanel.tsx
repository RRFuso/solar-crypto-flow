import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketRegime from './MarketRegime';
import NarrativeMaps from './NarrativeMaps';
import DailyInsights from './DailyInsights';

export const MarketContextPanel: React.FC = () => {
  return (
    <div className="h-full w-full p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MarketRegime />
        </div>
        <div className="lg:col-span-2">
          <NarrativeMaps />
        </div>
      </div>
      <div>
        <DailyInsights />
      </div>
    </div>
  );
};

export default MarketContextPanel;
