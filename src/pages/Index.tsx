
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CryptoPanel from "@/components/CryptoPanel";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import Auth from "@/components/auth/Auth";
import UserMenu from "@/components/auth/UserMenu";
import { MarketContextAndAIPanel } from '@/components/market-context/MarketContextAndAIPanel';
import { OnChainDataProvider } from '@/contexts/OnChainDataContext';
import { useAuth } from "@/contexts/AuthContext";
import DataPopulationPanel from "@/components/admin/DataPopulationPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlowControls } from "@/components/capital-flow/panel/FlowControls";
import { FlowPanelHeader } from "@/components/capital-flow/panel/FlowPanelHeader";
import { fetchMarketDataCoinGecko, fetchMarketDataBinance } from '@/lib/marketData';
import { toast } from 'sonner';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';

const Index = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");
  const [isDataPopulationModalOpen, setIsDataPopulationModalOpen] = useState(false);
  const { user } = useAuth();

  // State lifted from CapitalFlowPanel
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(15);
  const [flowLimit, setFlowLimit] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
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
    <OnChainDataProvider>
      <DashboardLayout>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Unified Header */}
          <header className="flex-shrink-0 px-2 md:px-4 h-auto md:h-16 flex flex-col md:flex-row items-center justify-between border-b border-slate-700/50 py-2 md:py-0">
            <div className="w-full md:w-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/SOLCRY.png" alt="SOLCRY Logo" className="w-7 h-7" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  SOLCRY
                </h1>
                <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                  Oracle
                </div>
              </div>
              <div className="md:hidden">
                {user ? <UserMenu openDataPopulationModal={() => setIsDataPopulationModalOpen(true)} /> : <Auth />}
              </div>
            </div>

            <div className="flex-grow w-full md:w-auto flex justify-center px-0 md:px-2 mt-2 md:mt-0">
              <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 h-10 md:h-10">
                <TabsTrigger 
                  value="market-context" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-[10px] md:text-xs px-1 py-1"
                >
                  🧠 Market Context & AI
                </TabsTrigger>
                <TabsTrigger 
                  value="capital-flow" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-[10px] md:text-xs px-1 py-1"
                >
                  💰 Capital Flow
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-[10px] md:text-xs px-1 py-1"
                >
                  📊 Market Data
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="hidden md:block">
              {user ? <UserMenu openDataPopulationModal={() => setIsDataPopulationModalOpen(true)} /> : <Auth />}
            </div>
          </header>

          {activeTab === 'capital-flow' && (
            <div className="md:hidden py-2 px-1 border-b border-slate-700/50">
              <div className="flex flex-row flex-wrap items-center justify-center gap-2">
                  <FlowControls
                    chartTimeframe={chartTimeframe}
                    onChartTimeframeChange={handleChartTimeframeChange}
                    showOnlyStrongSignals={showOnlyStrongSignals}
                    setShowOnlyStrongSignals={setShowOnlyStrongSignals}
                    zoomLevel={zoomLevel}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    flowLimit={flowLimit}
                    handleLimitChange={handleLimitChange}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    onRefresh={() => refetch()}
                    showLines={showLines}
                    setShowLines={setShowLines}
                  />
              </div>
            </div>
          )}

          <div className="flex-1 w-full md:overflow-hidden">
            <TabsContent value="market-context" className="h-full w-full">
              <MarketContextAndAIPanel />
            </TabsContent>
            <TabsContent value="capital-flow" className="h-full w-full">
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
            </TabsContent>
            <TabsContent value="crypto" className="h-full w-full">
              <CryptoPanel />
            </TabsContent>
          </div>
        </Tabs>
        
        {user && user.email === 'prof.rafaelfuso@gmail.com' && (
          <Dialog open={isDataPopulationModalOpen} onOpenChange={setIsDataPopulationModalOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Data Population</DialogTitle>
              </DialogHeader>
              <DataPopulationPanel />
            </DialogContent>
          </Dialog>
        )}
      </DashboardLayout>
    </OnChainDataProvider>
  );
};

export default Index;
