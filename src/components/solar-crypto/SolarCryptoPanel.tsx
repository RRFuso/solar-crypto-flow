
import React, { useState, useEffect } from 'react';
import { useSolarCryptoWebSocket } from '@/hooks/useSolarCryptoWebSocket';
import { analyzeFlows, detectAnomalies } from '@/lib/api/solarCryptoApi';
import { FlowData } from '@/types/crypto';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Radio, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import RealTimeFlowList from './RealTimeFlowList';
import AnomalyDetection from './AnomalyDetection';
import FlowHeatmap from './FlowHeatmap';

interface SolarCryptoPanelProps {
  initialFlows?: FlowData[];
}

const SolarCryptoPanel: React.FC<SolarCryptoPanelProps> = ({ initialFlows = [] }) => {
  const [flows, setFlows] = useState<FlowData[]>(initialFlows);
  const [realTimeMessages, setRealTimeMessages] = useState<any[]>([]);
  
  const { isConnected, lastMessage } = useSolarCryptoWebSocket({
    onMessage: (data) => {
      setRealTimeMessages((prev) => [data, ...prev].slice(0, 50));
      toast.info('Novo sinal recebido', {
        description: data.msg,
        icon: <Zap className="h-4 w-4" />
      });
    }
  });

  // Store last message in realTimeMessages array
  useEffect(() => {
    if (lastMessage) {
      setRealTimeMessages((prev) => [lastMessage, ...prev].slice(0, 50));
    }
  }, [lastMessage]);

  // Query for anomaly detection
  const { data: anomalyData, isLoading: anomalyLoading, refetch: refetchAnomalies } = useQuery({
    queryKey: ['anomaly-detection'],
    queryFn: detectAnomalies,
    refetchInterval: 60000, // Refresh every minute
    enabled: isConnected,
  });

  // Function to analyze flows
  const handleAnalyzeFlows = async () => {
    if (flows.length === 0) {
      toast.warning('Nenhum fluxo para analisar');
      return;
    }

    toast.info('Analisando fluxos...');
    try {
      const analyzedFlows = await analyzeFlows(flows);
      setFlows(analyzedFlows);
      toast.success(`${analyzedFlows.length} fluxos analisados`);
    } catch (error) {
      toast.error('Erro ao analisar fluxos');
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            SolarCripto Flow Engine
          </h2>
          <Badge 
            className={`${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
          >
            {isConnected ? (
              <div className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Conectado
              </div>
            ) : 'Desconectado'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyzeFlows}
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
          >
            Analisar Fluxos
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetchAnomalies()}
            disabled={anomalyLoading}
            className="text-gray-400 hover:text-white"
            title="Atualizar detecção de anomalias"
          >
            <RefreshCw className={`w-4 h-4 ${anomalyLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Real-time signals panel */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Sinais em Tempo Real
            </h3>
            <Badge className="bg-gray-800/50">
              {realTimeMessages.length} sinais
            </Badge>
          </div>
          
          <ScrollArea className="h-[300px]">
            <RealTimeFlowList messages={realTimeMessages} />
          </ScrollArea>
        </div>

        {/* Anomaly detection panel */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Detecção de Anomalias
            </h3>
            {anomalyLoading && (
              <Badge className="bg-gray-800/50">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Atualizando
              </Badge>
            )}
          </div>
          
          <AnomalyDetection 
            data={anomalyData} 
            isLoading={anomalyLoading}
          />
        </div>
      </div>
      
      {/* Flow Heatmap - Visualization */}
      <div className="mt-4 border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <FlowHeatmap title="Heatmap de Fluxo de Capital" />
      </div>
    </div>
  );
};

export default SolarCryptoPanel;
