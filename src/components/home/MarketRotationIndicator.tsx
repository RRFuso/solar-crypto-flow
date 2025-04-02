
import React from 'react';
import { useMarketRotation } from '@/hooks/useMarketRotation';
import { ArrowDownRight, ArrowUpRight, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndexFlowChart } from './IndexFlowChart';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const MarketRotationIndicator = () => {
  const [timeframe, setTimeframe] = React.useState('7d');
  const { data, isLoading, error, isError, refetch, isFetching } = useMarketRotation(timeframe);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  const handleRefresh = () => {
    toast.info('Atualizando dados de mercado...');
    refetch();
  };

  return (
    <Card className="w-full h-full bg-black/50 border border-gray-800 overflow-hidden">
      <CardHeader className="border-b border-gray-800 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Rotação de Capital Macro
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isLoading || isFetching}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-32 bg-black/20 border-gray-800">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="1d">1 dia</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-300">Carregando dados do mercado...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-96 text-amber-400 gap-4">
            <AlertTriangle className="w-8 h-8" />
            <div className="text-center">
              <p className="mb-2">Erro ao carregar dados</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="text-amber-400 border-amber-400 hover:bg-amber-400/10"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : data ? (
          <div className="p-4">
            {data.indices.some(index => index.value === undefined) && (
              <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-yellow-400 text-xs flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Alguns dados podem estar utilizando valores estimados devido a limitações da API
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {data.indices.map((index) => (
                <div key={index.id} className="bg-black/30 border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index.color }}></div>
                      <span className="text-gray-200">{index.name}</span>
                    </div>
                    <div className={`flex items-center ${index.change && index.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {index.change && index.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      {index.change !== undefined ? `${index.change.toFixed(2)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-96 w-full">
              <IndexFlowChart data={data} />
            </div>
            
            <div className="mt-4 text-sm text-gray-300">
              <h4 className="font-bold mb-2 text-white">Análise de Rotação de Capital</h4>
              {data.flows.length > 0 ? (
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
              ) : (
                <p className="italic text-gray-400">Nenhum fluxo de capital significativo detectado neste período.</p>
              )}
              
              <div className="mt-4 text-xs text-gray-400">
                Última atualização: {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MarketRotationIndicator;
