
import { NarrativeData } from '@/types/narratives';
import { NARRATIVES } from './constants';
import { predictNarrativeFlows } from './predictions';
import { calculateHistoricalFlows } from './historicalFlows';
import { getMarketAttentionData } from './marketAttention';

// Get all narrative data
export const getNarratives = (): NarrativeData[] => {
  return NARRATIVES;
};

// Get a specific narrative by ID
export const getNarrativeById = (id: string): NarrativeData | undefined => {
  return NARRATIVES.find(narrative => narrative.id === id);
};

export {
  predictNarrativeFlows,
  calculateHistoricalFlows,
  getMarketAttentionData
};
