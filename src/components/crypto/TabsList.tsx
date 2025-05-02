import React from 'react';
import { TabsList as BaseTabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, TrendingUp, ArrowDownCircle, ArrowUpCircle, MessageSquare, Zap } from 'lucide-react';

const TabsList = () => {
  return (
    <BaseTabsList className="w-full grid grid-cols-6 h-20 bg-gray-800">
      <TabsTrigger value="outperforming" className="flex flex-col items-center gap-1 h-auto py-2">
        <LineChart className="w-4 h-4" />
        <span className="text-xs">Alt x BTC</span>
      </TabsTrigger>
      <TabsTrigger value="bullish" className="flex flex-col items-center gap-1 h-auto py-2">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs">Tendência Alta</span>
      </TabsTrigger>
      <TabsTrigger value="oversold" className="flex flex-col items-center gap-1 h-auto py-2">
        <ArrowDownCircle className="w-4 h-4" />
        <span className="text-xs">Sobrevenda 4h</span>
      </TabsTrigger>
      <TabsTrigger value="overbought" className="flex flex-col items-center gap-1 h-auto py-2">
        <ArrowUpCircle className="w-4 h-4" />
        <span className="text-xs">Sobrecompra 4h</span>
      </TabsTrigger>
      <TabsTrigger value="social" className="flex flex-col items-center gap-1 h-auto py-2">
        <MessageSquare className="w-4 h-4" />
        <span className="text-xs">Social Hype</span>
      </TabsTrigger>
      <TabsTrigger value="explosive" className="flex flex-col items-center gap-1 h-auto py-2">
        <Zap className="w-4 h-4" />
        <span className="text-xs">Alta Explosiva</span>
      </TabsTrigger>
    </BaseTabsList>
  );
};

export default TabsList;