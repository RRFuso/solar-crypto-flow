
import React from 'react';
import { NarrativeVisualization } from './NarrativeVisualization';
import { NarrativeFlow } from '@/types/narratives';

interface NarrativeVisualizationWrapperProps {
  isLoading: boolean;
  flowData: NarrativeFlow[];
  usePredictions: boolean;
  predictionConfidence?: number;
}

export const NarrativeVisualizationWrapper: React.FC<NarrativeVisualizationWrapperProps> = ({
  isLoading,
  flowData,
  usePredictions,
  predictionConfidence
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <NarrativeVisualization 
      flowData={flowData}
      usePredictions={usePredictions}
      predictionConfidence={predictionConfidence}
    />
  );
};
