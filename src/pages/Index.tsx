
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import { GapMonitorPanel } from "@/components/gap-monitor";
import Auth from "@/components/auth/Auth";
import UserMenu from "@/components/auth/UserMenu";
import { OnChainDataProvider } from '@/contexts/OnChainDataContext';
import { FlowControlsProvider, useFlowControls } from '@/contexts/FlowControlsContext';
import { useAuth } from "@/contexts/AuthContext";
import DataPopulationPanel from "@/components/admin/DataPopulationPanel";
import ApiMetricsDashboard from "@/components/admin/ApiMetricsDashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import FlowControls from "@/components/capital-flow/panel/FlowControls";
import { FlowPanelHeader } from "@/components/capital-flow/panel/FlowPanelHeader";
import { fetchMarketDataCoinGecko, fetchMarketDataBinance } from '@/lib/marketData';
import { toast } from 'sonner';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { useCredits } from '@/hooks/useCredits';
import { useRealtimeMarketData } from '@/hooks/useRealtimeMarketData';
import { Badge } from '@/components/ui/badge';
import AIWatchlistSection from "@/components/capital-flow/panel/AIWatchlistSection";

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState("capital-flow");
  const [isDataPopulationModalOpen, setIsDataPopulationModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMetricsDashboardOpen, setIsMetricsDashboardOpen] = useState(false);
  const { user } = useAuth();
  const { canAccessFlow, getMaxFlows } = useCredits();

  // Use FlowControls context
  const {
    timeframe,
    chartTimeframe,
    zoomLevel,
    flowLimit,
    selectedCategory,
    showOnlyStrongSignals,
    showLines,
    dataSource,
    setChartTimeframe,
    setShowOnlyStrongSignals,
    setSelectedCategory,
    setShowLines,
    handleZoomIn,
    handleZoomOut,
    handleLimitChange,
  } = useFlowControls();

  // Use Realtime hook for crypto_prices table
  const { 
    data: realtimeFlowData, 
    isLoading: isRealtimeLoading, 
    error: realtimeError, 
    isConnected,
    refetch: realtimeRefetch 
  } = useRealtimeMarketData();

  // Fallback to polling if Realtime is not connected or has errors
  const { data: pollingFlowData, isLoading: isPollingLoading, error: pollingError, refetch: pollingRefetch } = useQuery({
    queryKey: ['capital-flow-fallback', timeframe, dataSource],
    queryFn: () => {
      if (dataSource === 'binance') {
        return fetchMarketDataBinance();
      } else {
        return fetchMarketDataCoinGecko(timeframe);
      }
    },
    enabled: !isConnected || !!realtimeError, // Only enable if Realtime is disconnected or has error
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 1, // Polling every 1 minute as fallback
    meta: {
      onError: () => {
        toast("Failed to fetch market data. Please try again later.", {
          description: "An error occurred while fetching market data."
        });
      }
    }
  });

  // Use Realtime data if connected, otherwise use polling data
  const flowData = isConnected ? realtimeFlowData : pollingFlowData;
  const isLoading = isConnected ? isRealtimeLoading : isPollingLoading;
  const error = isConnected ? realtimeError : pollingError;
  const refetch = isConnected ? realtimeRefetch : pollingRefetch;

  const processedFlowData = useFilteredFlowData(flowData, flowLimit, selectedCategory);
  const { predictions } = usePredictions(flowData, selectedCategory, chartTimeframe);

  // Apply flow limit based on user credits
  const maxFlows = getMaxFlows();
  const effectiveFlowLimit = useMemo(() => {
    return Math.min(flowLimit, maxFlows);
  }, [flowLimit, maxFlows]);

  // Handle flow limit toast notifications separately
  const hasShownToastRef = useRef(false);
  useEffect(() => {
    if (flowLimit > maxFlows) {
      if (!hasShownToastRef.current) {
        if (!user) {
          toast.error('Limite de 30 flows. Cadastre-se para expandir para 60 flows.');
        } else {
          toast.error('Limite de flows atingido. Faça upgrade para acesso ilimitado.');
        }
        hasShownToastRef.current = true;
        setTimeout(() => {
          hasShownToastRef.current = false;
        }, 5000);
      }
    }
  }, [flowLimit, maxFlows, user]);

  const filteredPredictions = useMemo(() => {
    if (showOnlyStrongSignals) {
      return predictions.filter(p => p.confidence >= 0.6);
    }
    return predictions;
  }, [predictions, showOnlyStrongSignals]);

  // Debounced chart timeframe change to avoid excessive re-renders
  const refetchTimeoutRef = useRef<NodeJS.Timeout>();
  const handleChartTimeframeChange = useCallback((value: string) => {
    setChartTimeframe(value);
    
    // Clear existing timeout
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    
    // Debounce by 300ms - no need to refetch since refetchInterval handles it
    refetchTimeoutRef.current = setTimeout(() => {
      // Just update state, refetchInterval will handle data updates
    }, 300);
  }, [setChartTimeframe]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <OnChainDataProvider>
      <DashboardLayout>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Unified Header */}
          <header className="flex-shrink-0 px-2 md:px-4 h-auto md:h-16 flex flex-col md:flex-row items-center justify-between border-b border-slate-700/50 py-2 md:py-0">
            <div className="w-full md:w-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/SOLCRY.webp" alt="SOLCRY Logo" className="w-10 h-10" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  SOLCRY
                </h1>
                <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                  Oracle
                </div>
                {/* Realtime Connection Indicator */}
                <Badge 
                  variant={isConnected ? "default" : "secondary"}
                  className={`text-[10px] px-2 py-0.5 ${
                    isConnected 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                  }`}
                >
                  {isConnected ? '🟢 RT' : '🟡 Poll'}
                </Badge>
              </div>
              <div className="md:hidden">
                {user ? (
                  <UserMenu 
                    openDataPopulationModal={() => setIsDataPopulationModalOpen(true)}
                    openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                    openAuthModal={() => setIsAuthModalOpen(true)}
                    openMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
                  />
                ) : (
                  <UserMenu 
                    openDataPopulationModal={() => setIsDataPopulationModalOpen(true)}
                    openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                    openAuthModal={() => setIsAuthModalOpen(true)}
                    openMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
                  />
                )}
              </div>
            </div>

            <div className="flex-grow w-full md:w-auto flex justify-center px-0 md:px-2 mt-2 md:mt-0">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 h-10 md:h-10">
                <TabsTrigger 
                  value="capital-flow" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs md:text-sm px-2 py-1"
                >
                  ☀️ Sistema Solar
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-watchlist" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs md:text-sm px-2 py-1"
                >
                  🔮 AI Watchlist
                </TabsTrigger>
                <TabsTrigger 
                  value="gap-monitor" 
                  className="text-white font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-black text-xs md:text-sm px-2 py-1"
                >
                  📉 CME GAPs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="hidden md:block">
              {user ? (
                <UserMenu 
                  openDataPopulationModal={() => setIsDataPopulationModalOpen(true)}
                  openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  openAuthModal={() => setIsAuthModalOpen(true)}
                  openMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
                />
              ) : (
                <UserMenu 
                  openDataPopulationModal={() => setIsDataPopulationModalOpen(true)}
                  openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  openAuthModal={() => setIsAuthModalOpen(true)}
                  openMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
                />
              )}
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
                    flowLimit={effectiveFlowLimit}
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
                flowLimit={effectiveFlowLimit}
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
            <TabsContent value="ai-watchlist" className="h-full w-full overflow-y-auto">
              <div className="p-4">
                <AIWatchlistSection 
                  predictions={filteredPredictions} 
                  chartTimeframe={chartTimeframe}
                  maxItems={15}
                />
              </div>
            </TabsContent>
            <TabsContent value="gap-monitor" className="h-full w-full overflow-y-auto">
              <div className="p-4">
                <GapMonitorPanel />
              </div>
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

        <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-7xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Assinatura</DialogTitle>
            </DialogHeader>
            <SubscriptionPlans />
          </DialogContent>
        </Dialog>

        <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Login / Cadastro</DialogTitle>
            </DialogHeader>
            <Auth />
          </DialogContent>
        </Dialog>

        <Dialog open={isMetricsDashboardOpen} onOpenChange={setIsMetricsDashboardOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>API Metrics Dashboard</DialogTitle>
            </DialogHeader>
            <ApiMetricsDashboard />
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </OnChainDataProvider>
  );
};

const Index = () => {
  return (
    <FlowControlsProvider>
      <IndexContent />
    </FlowControlsProvider>
  );
};

export default Index;
