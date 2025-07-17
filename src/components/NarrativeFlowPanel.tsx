import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { getNarratives, calculateHistoricalFlows, predictNarrativeFlows } from '@/lib/narrativeData';
import { NarrativeControls } from './narrative-flow/NarrativeControls';
import { NarrativeVisualizationWrapper } from './narrative-flow/NarrativeVisualizationWrapper';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const NarrativeFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [usePredictions, setUsePredictions] = useState(false);

  const { data: narratives, isLoading: narrativesLoading, refetch: refetchNarratives } = useQuery({
    queryKey: ['narratives', timeframe],
    queryFn: () => getNarratives(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const { data: historicalFlows, isLoading: historicalLoading, refetch: refetchHistorical } = useQuery({
    queryKey: ['narrative-historical-flows', timeframe, narratives],
    queryFn: () => calculateHistoricalFlows(narratives || []),
    enabled: !!narratives && narratives.length > 0,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: predictionData, isLoading: predictionLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['narrative-predictions', timeframe, narratives],
    queryFn: () => predictNarrativeFlows(narratives || []),
    enabled: !!narratives && narratives.length > 0,
    refetchInterval: 120000,
    staleTime: 60000,
    meta: {
      onError: () => {
        toast.error("Failed to generate narrative predictions. Please try again later.");
      }
    }
  });

  const isLoading = narrativesLoading || historicalLoading || (usePredictions && predictionLoading);
  const flowData = usePredictions 
    ? predictionData?.narrativeFlows || []
    : historicalFlows || [];

  const handleRefresh = () => {
    toast.info("Refreshing all narrative data...");
    refetchNarratives();
  };

  const handleTogglePredictions = (checked: boolean) => {
    setUsePredictions(checked);
    if (checked) {
      toast.success("AI Predictions Enabled");
    } else {
      toast.info("Historical Data Only");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 bg-clip-text text-transparent">
            Narrative Flows
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BrainCircuit className="h-5 w-5 text-purple-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {usePredictions 
                    ? "AI predictions using TensorFlow.js LSTM model trained on narrative capital flow patterns" 
                    : "Historical capital flows between different crypto market narratives"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <NarrativeControls 
          timeframe={timeframe}
          usePredictions={usePredictions}
          onTimeframeChange={setTimeframe}
          onPredictionsChange={handleTogglePredictions}
          onRefresh={handleRefresh}
        />
      </div>

      <NarrativeVisualizationWrapper 
        isLoading={isLoading}
        narratives={narratives || []}
        flowData={flowData}
        usePredictions={usePredictions}
        predictionConfidence={predictionData?.confidence}
      />
    </div>
  );
};

export default NarrativeFlowPanel;