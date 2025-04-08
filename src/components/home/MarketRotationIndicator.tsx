
import React from 'react';
import { useMarketRotation } from '@/hooks/useMarketRotation';
import { ArrowDownRight, ArrowUpRight, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IndexFlowChart from './IndexFlowChart';
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
    <div className="w-full h-full bg-black/50 border-gray-800 overflow-hidden flex flex-col">
      <div className="border-b border-gray-800 p-4 flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Fluxo de Capital em Cripto
        </h2>
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
      </div>
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-300">Carregando dados do mercado...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-amber-400 gap-4">
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
          <div className="h-full w-full">
            {data.indices.some(index => index.value === undefined) && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-yellow-400 text-xs flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Alguns dados podem estar utilizando valores estimados
                </p>
              </div>
            )}
            
            <div className="h-full w-full">
              <IndexFlowChart data={data} />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3 text-xs text-gray-400">
              Última atualização: {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MarketRotationIndicator;
