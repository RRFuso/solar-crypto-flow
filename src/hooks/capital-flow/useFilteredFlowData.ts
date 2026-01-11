
import { useMemo } from 'react';
import { FlowData } from '@/types/crypto';
import { getCategoriesForSymbol, belongsToCategory } from '@/lib/marketData/categoryMapping';

export const useFilteredFlowData = (
  flowData: FlowData[] | undefined, 
  flowLimit: number, 
  activeCategory: string
) => {
  // Filter and process flow data
  const processedFlowData = useMemo(() => {
    if (!flowData) return [];
    
    // Separate stablecoins and other tokens
    const stablecoins = flowData.filter(flow => 
      belongsToCategory(flow.from, 'stablecoin') || belongsToCategory(flow.to, 'stablecoin')
    );
    
    const otherFlows = flowData.filter(flow => 
      !belongsToCategory(flow.from, 'stablecoin') && !belongsToCategory(flow.to, 'stablecoin')
    );
    
    // Sort other flows by value to get the most significant ones
    let sortedOtherFlows = [...otherFlows].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    // Take the top N flows from the non-stablecoin list
    const topOtherFlows = sortedOtherFlows.slice(0, flowLimit);
    
    // Combine stablecoin flows and the top other flows
    const combinedFlows = [...stablecoins, ...topOtherFlows];
    
    // Enrich flows with category data
    const enrichedFlows = combinedFlows.map(flow => ({
      ...flow,
      fromCategories: getCategoriesForSymbol(flow.from),
      toCategories: getCategoriesForSymbol(flow.to),
    }));
    
    return enrichedFlows;
  }, [flowData, flowLimit]);

  return processedFlowData;
};
