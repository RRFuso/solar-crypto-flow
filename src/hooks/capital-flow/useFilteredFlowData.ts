
import { useMemo } from 'react';
import { FlowData } from '@/types/crypto';
import { getCategoriesForSymbol } from '@/lib/marketData/categoryMapping';

export const useFilteredFlowData = (
  flowData: FlowData[] | undefined, 
  flowLimit: number, 
  activeCategory: string
) => {
  // Filter and process flow data
  const processedFlowData = useMemo(() => {
    if (!flowData) return [];
    
    // Sort by value (volume) to get the most significant flows
    let sortedFlows = [...flowData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    // Enrich flows with category data for both `from` and `to` symbols
    const enrichedFlows = sortedFlows.map(flow => ({
      ...flow,
      fromCategories: getCategoriesForSymbol(flow.from),
      toCategories: getCategoriesForSymbol(flow.to),
    }));
    
    // Limit to the top N flows to reduce visual clutter
    return enrichedFlows.slice(0, flowLimit);
  }, [flowData, flowLimit]);

  return processedFlowData;
};
