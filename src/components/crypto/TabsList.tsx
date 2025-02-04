import React from 'react';
import { TabsList as BaseTabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, TrendingUp, ArrowDownCircle, ArrowUpCircle, Activity, Zap, Settings2 } from 'lucide-react';

const TabsList = () => {
  return (
    <BaseTabsList className="w-full grid grid-cols-7 h-20 bg-gray-800">
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
      <TabsTrigger value="matching" className="flex flex-col items-center gap-1 h-auto py-2">
        <Activity className="w-4 h-4" />
        <span className="text-xs">Match Entrada</span>
      </TabsTrigger>
      <TabsTrigger value="explosive" className="flex flex-col items-center gap-1 h-auto py-2">
        <Zap className="w-4 h-4" />
        <span className="text-xs">Alta Explosiva</span>
      </TabsTrigger>
      <TabsTrigger value="customize" className="flex flex-col items-center gap-1 h-auto py-2">
        <Settings2 className="w-4 h-4" />
        <span className="text-xs">Personalizar</span>
      </TabsTrigger>
    </BaseTabsList>
  );
};

export default TabsList;