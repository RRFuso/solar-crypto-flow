
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { FlowVisualization } from '../FlowVisualization';
import { SolarSystemControls } from './SolarSystemControls';
import { LegalDisclaimer } from './LegalDisclaimer';
import { usePaginatedCryptos } from '@/hooks/capital-flow/usePaginatedCryptos';
import { useSolarCoreCommand } from '@/contexts/SolarCoreCommandContext';
import { supabase } from '@/integrations/supabase/client';

interface SolarSystemSectionProps {
  flowData: FlowData[];
  zoomLevel: number;
  predictions: Prediction[];
  chartTimeframe: string;
  showLines: boolean;
  isLoading: boolean;
  error: unknown;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTimeframeChange: (value: string) => void;
  onRefresh: () => void;
  onShowLinesChange: (value: boolean) => void;
  flowLimit: number;
  onFlowLimitChange: (value: number[]) => void;
}

const SolarSystemSection: React.FC<SolarSystemSectionProps> = ({
  flowData,
  zoomLevel,
  predictions,
  chartTimeframe,
  showLines,
  isLoading,
  error,
  onZoomIn,
  onZoomOut,
  onTimeframeChange,
  onRefresh,
  onShowLinesChange,
  flowLimit,
  onFlowLimitChange,
}) => {
  // ── Oracle command bridge ─────────────────────────────────────────────────
  const { command, clearCommand } = useSolarCoreCommand();

  // Derive external props from the current Oracle command
  const externalCategory = command?.activeCategory ?? undefined;
  const externalList = command?.action === 'reconstruct' ? 'top-100' : undefined;
  const externalSymbols = command?.selectedSymbols ?? undefined;

  // Fetch the full ranked universe (top 1000 by market cap) so that lists
  // 100-200 ... 900-1000 can paginate even when live flowData is sparse.
  const { data: rankedUniverseRaw } = useQuery({
    queryKey: ['ranked-universe-1000'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cryptocurrencies')
        .select('symbol, name, market_cap, volume_24h, price_change_percentage_24h, current_price')
        .order('market_cap', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const rankingSource: FlowData[] | undefined = useMemo(() => {
    if (!rankedUniverseRaw) return undefined;
    return rankedUniverseRaw.map((c: any) => ({
      id: `rank-${c.symbol}`,
      from: (c.symbol || '').toUpperCase(),
      to: 'BTC',
      value: 0,
      percentage: 0,
      marketCap: c.market_cap ?? 0,
      volume: c.volume_24h ?? 0,
      change: c.price_change_percentage_24h ?? 0,
      price: c.current_price ?? 0,
      name: c.name,
    } as FlowData));
  }, [rankedUniverseRaw]);

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalCryptos,
    currentList,
    selectedCategory,
    searchTerm,
    setCurrentList,
    setSelectedCategory,
    setSearchTerm,
    goToPage,
  } = usePaginatedCryptos({
    flowData,
    pageSize: 99,
    externalCategory,
    externalList,
    externalSymbols,
    rankingSource,
  });

  // Clear the Oracle command after it has been consumed by this render cycle
  const prevCommandRef = useRef<typeof command>(null);
  useEffect(() => {
    if (command && command !== prevCommandRef.current) {
      prevCommandRef.current = command;
      // Give the paginated hook one tick to react, then clear
      const t = setTimeout(() => clearCommand(), 500);
      return () => clearTimeout(t);
    }
  }, [command, clearCommand]);

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando Sistema Solar Cripto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-400 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-lg mb-2">⚠️ Falha ao carregar dados</p>
          <p className="text-sm text-slate-500">Por favor, tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  // Determine highlighted symbols for the visualization layer
  const highlightedSymbols: Set<string> | undefined =
    command?.selectedSymbols && command.selectedSymbols.length > 0
      ? new Set(command.selectedSymbols.map(s => s.toUpperCase()))
      : undefined;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <SolarSystemControls
        currentList={currentList}
        onListChange={setCurrentList}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalCryptos={totalCryptos}
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        chartTimeframe={chartTimeframe}
        onTimeframeChange={onTimeframeChange}
        onRefresh={onRefresh}
        showLines={showLines}
        onShowLinesChange={onShowLinesChange}
        flowLimit={flowLimit}
        onFlowLimitChange={onFlowLimitChange}
      />

      {/* Visualization */}
      <div className="flex-1 relative overflow-hidden">
        <FlowVisualization
          flowData={paginatedData}
          zoomLevel={zoomLevel}
          predictions={predictions}
          chartTimeframe={chartTimeframe}
          activeCategory={selectedCategory}
          showLines={showLines}
          highlightedSymbols={highlightedSymbols}
        />

        {/* Legal Disclaimer */}
        <div className="absolute bottom-1 left-2 right-2 z-10">
          <LegalDisclaimer variant="minimal" />
        </div>
      </div>
    </div>
  );
};

export default memo(SolarSystemSection);
