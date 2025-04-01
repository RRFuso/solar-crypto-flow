
import React from 'react';
import { useMarketRotation } from '@/hooks/useMarketRotation';
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndexFlowChart } from './IndexFlowChart';

const MarketRotationIndicator = () => {
  const [timeframe, setTimeframe] = React.useState('7d');
  const { data, isLoading, error } = useMarketRotation(timeframe);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  return (
    <Card className="w-full h-full bg-black/50 border border-gray-800 overflow-hidden">
      <CardHeader className="border-b border-gray-800 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Rotação de Capital Macro
        </CardTitle>
        <Select value={timeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-32 bg-black/20 border-gray-800">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">1 dia</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-red-500">
            Erro ao carregar dados
          </div>
        ) : data ? (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {data.indices.map((index) => (
                <div key={index.id} className="bg-black/30 border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index.color }}></div>
                      <span>{index.name}</span>
                    </div>
                    <div className={`flex items-center ${index.change && index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {index.change && index.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      {index.change ? index.change.toFixed(2) : '0.00'}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-96 w-full">
              <IndexFlowChart data={data} />
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <h4 className="font-bold mb-2">Análise de Rotação de Capital</h4>
              <ul className="space-y-1 list-disc pl-5">
                {data.flows.map((flow, idx) => {
                  const fromIndex = data.indices.find(i => i.id === flow.from);
                  const toIndex = data.indices.find(i => i.id === flow.to);
                  
                  if (!fromIndex || !toIndex) return null;
                  
                  return (
                    <li key={idx}>
                      Fluxo de{' '}
                      <span style={{ color: fromIndex.color }} className="font-medium">
                        {fromIndex.name}
                      </span>{' '}
                      para{' '}
                      <span style={{ color: toIndex.color }} className="font-medium">
                        {toIndex.name}
                      </span>{' '}
                      ({flow.percentage.toFixed(2)}%)
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MarketRotationIndicator;
