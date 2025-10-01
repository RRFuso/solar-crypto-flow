import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import CapitalFlowPanel from '../capital-flow/CapitalFlowPanel';
import { fetchMarketDataCoinGecko, fetchMarketDataBinance } from '@/lib/marketData';
import { toast } from 'sonner';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';

const HomePanel = () => {
  // State for CapitalFlowPanel
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(15);
  const [flowLimit, setFlowLimit] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Debug log para monitorar mudanças de categoria
  React.useEffect(() => {
    console.log('🏠 HomePanel: selectedCategory changed to:', selectedCategory);
  }, [selectedCategory]);
  const [showOnlyStrongSignals, setShowOnlyStrongSignals] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [dataSource, setDataSource] = useState<'coingecko' | 'binance'>('coingecko');

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe, dataSource],
    queryFn: () => {
      if (dataSource === 'binance') {
        return fetchMarketDataBinance();
      } else {
        return fetchMarketDataCoinGecko(timeframe);
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    meta: {
      onError: () => {
        toast("Failed to fetch market data. Please try again later.", {
          description: "An error occurred while fetching market data."
        });
      }
    }
  });

  const processedFlowData = useFilteredFlowData(flowData, flowLimit, selectedCategory);
  const { predictions } = usePredictions(flowData, selectedCategory, chartTimeframe);

  const filteredPredictions = useMemo(() => {
    if (showOnlyStrongSignals) {
      return predictions.filter(p => p.confidence >= 0.6);
    }
    return predictions;
  }, [predictions, showOnlyStrongSignals]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 20));
  const handleLimitChange = (value: number[]) => setFlowLimit(value[0]);
  const handleChartTimeframeChange = (value: string) => {
    setChartTimeframe(value);
    refetch();
  };

  return (
    <div className="h-full">
      <div className="w-full h-full">
        <CapitalFlowPanel
          isLoading={isLoading}
          error={error}
          processedFlowData={processedFlowData}
          zoomLevel={zoomLevel}
          filteredPredictions={filteredPredictions}
          chartTimeframe={chartTimeframe}
          activeCategory={selectedCategory}
          showLines={showLines}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          flowLimit={flowLimit}
          handleLimitChange={handleLimitChange}
          handleChartTimeframeChange={handleChartTimeframeChange}
          showOnlyStrongSignals={showOnlyStrongSignals}
          setShowOnlyStrongSignals={setShowOnlyStrongSignals}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          refetch={refetch}
          setShowLines={setShowLines}
        />
      </div>
    </div>
  );
};

export default HomePanel;
