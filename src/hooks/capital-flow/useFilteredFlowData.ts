
import { useMemo } from 'react';
import { FlowData } from '@/types/crypto';

export const useFilteredFlowData = (
  flowData: FlowData[] | undefined, 
  activeCategory: string
) => {
  // Filter and process flow data
  const processedFlowData = useMemo(() => {
    if (!flowData) return [];
    
    // Sort by value (volume) to get the most significant flows
    let sortedFlows = [...flowData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    // Filter by category if selected
    if (activeCategory !== 'all') {
      sortedFlows = sortedFlows.filter(flow => {
        const fromHasCategory = flow.fromCategory === activeCategory || 
                               (flow.categories && flow.categories.includes(activeCategory));
        const toHasCategory = flow.toCategory === activeCategory || 
                             (flow.categories && flow.categories.includes(activeCategory));
        return fromHasCategory || toHasCategory || flow.category === activeCategory;
      });
    }
    
    // Limit to the top 50 flows to reduce visual clutter
    return sortedFlows.slice(0, 50);
  }, [flowData, activeCategory]);

  return { processedFlowData };
};
