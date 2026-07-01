
import { useState, useMemo, useEffect, useCallback, useRef, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CapitalFlowPanel from "@/components/capital-flow/CapitalFlowPanel";
import Auth from "@/components/auth/Auth";
import UserMenu from "@/components/auth/UserMenu";

import { FlowControlsProvider, useFlowControls } from '@/contexts/FlowControlsContext';
import { SolarCoreCommandProvider, useSolarCoreCommand } from '@/contexts/SolarCoreCommandContext';
import { useAuth } from "@/contexts/AuthContext";
import DataPopulationPanel from "@/components/admin/DataPopulationPanel";
import ApiMetricsDashboard from "@/components/admin/ApiMetricsDashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { fetchMarketDataCoinGecko, fetchMarketDataBinance } from '@/lib/marketData';
import { toast } from 'sonner';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { useCredits } from '@/hooks/useCredits';
import { useRealtimeMarketData } from '@/hooks/useRealtimeMarketData';
import { Badge } from '@/components/ui/badge';
import HeliusOracleChat from "@/components/ai/HeliusOracleChat";
import { Suspense } from "react";

const IndexContent = () => {
  const [isDataPopulationModalOpen, setIsDataPopulationModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMetricsDashboardOpen, setIsMetricsDashboardOpen] = useState(false);
  const { user } = useAuth();
  const { canAccessFlow, getMaxFlows } = useCredits();
  const { command } = useSolarCoreCommand();

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

  // Apply Oracle commands to Solar Core
  const effectiveCategory = command?.activeCategory || selectedCategory;
  const effectiveZoom = command?.zoomLevel || zoomLevel;

  const { 
    data: realtimeFlowData, 
    isLoading: isRealtimeLoading, 
    error: realtimeError, 
    isConnected,
    refetch: realtimeRefetch 
  } = useRealtimeMarketData();

  const { data: pollingFlowData, isLoading: isPollingLoading, error: pollingError, refetch: pollingRefetch } = useQuery({
    queryKey: ['capital-flow-fallback', timeframe, dataSource],
    queryFn: () => {
      if (dataSource === 'binance') {
        return fetchMarketDataBinance();
      } else {
        return fetchMarketDataCoinGecko(timeframe);
      }
    },
    enabled: !isConnected || !!realtimeError,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 1,
    meta: {
      onError: () => {
        toast("Failed to fetch market data. Please try again later.", {
          description: "An error occurred while fetching market data."
        });
      }
    }
  });

  const flowData = isConnected ? realtimeFlowData : pollingFlowData;
  const isLoading = isConnected ? isRealtimeLoading : isPollingLoading;
  const error = isConnected ? realtimeError : pollingError;
  const refetch = isConnected ? realtimeRefetch : pollingRefetch;

  const processedFlowData = useFilteredFlowData(flowData, flowLimit, effectiveCategory);
  const { predictions } = usePredictions(flowData, effectiveCategory, chartTimeframe);

  const maxFlows = getMaxFlows();
  const effectiveFlowLimit = useMemo(() => {
    return Math.min(flowLimit, maxFlows);
  }, [flowLimit, maxFlows]);

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

  const refetchTimeoutRef = useRef<NodeJS.Timeout>();
  const handleChartTimeframeChange = useCallback((value: string) => {
    setChartTimeframe(value);
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {}, 300);
  }, [setChartTimeframe]);

  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <DashboardLayout>
        {/* Unified Header */}
        <header className="flex-shrink-0 px-2 md:px-4 h-auto md:h-14 flex flex-col md:flex-row items-center justify-between border-b border-slate-700/50 py-2 md:py-0">
          <div className="flex items-center space-x-2">
            <img src="/SOLCRY.webp" alt="SOLCRY Logo" className="w-10 h-10" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              SOLCRY
            </h1>
            <div className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
              Command Center
            </div>
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

          <div className="flex items-center">
            <UserMenu 
              openDataPopulationModal={() => setIsDataPopulationModalOpen(true)}
              openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              openAuthModal={() => setIsAuthModalOpen(true)}
              openMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
            />
          </div>
        </header>

        {/* Command Center: Split Panel */}
        <main className="flex-1 flex w-full overflow-hidden">
          {/* Solar Core - Main Area */}
          <div className="flex-1 h-full overflow-hidden">
            <CapitalFlowPanel 
              isLoading={isLoading}
              error={error}
              processedFlowData={processedFlowData}
              zoomLevel={effectiveZoom}
              filteredPredictions={filteredPredictions}
              chartTimeframe={chartTimeframe}
              activeCategory={effectiveCategory}
              showLines={showLines}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              flowLimit={effectiveFlowLimit}
              handleLimitChange={handleLimitChange}
              handleChartTimeframeChange={handleChartTimeframeChange}
              showOnlyStrongSignals={showOnlyStrongSignals}
              setShowOnlyStrongSignals={setShowOnlyStrongSignals}
              selectedCategory={effectiveCategory}
              setSelectedCategory={setSelectedCategory}
              refetch={refetch}
              setShowLines={setShowLines}
            />
          </div>

          {/* Helius Oracle - Sidebar */}
          <aside className="w-[380px] min-w-[320px] h-full border-l border-slate-700/50 hidden md:flex flex-col bg-slate-900/60">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            }>
              <HeliusOracleChat className="h-full border-0 rounded-none" />
            </Suspense>
          </aside>
        </main>

        {/* Modals */}
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
    </>
  );
};

const Index = () => {
  return (
    <FlowControlsProvider>
      <SolarCoreCommandProvider>
        <IndexContent />
      </SolarCoreCommandProvider>
    </FlowControlsProvider>
  );
};

export default Index;
