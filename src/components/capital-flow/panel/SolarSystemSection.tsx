
import React, { memo, useMemo } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { FlowVisualization } from '../FlowVisualization';
import { FlowLegend } from '../FlowLegend';
import { SolarSystemControls } from './SolarSystemControls';
import { LegalDisclaimer } from './LegalDisclaimer';
import { usePaginatedCryptos } from '@/hooks/capital-flow/usePaginatedCryptos';

interface SolarSystemSectionProps {
  flowData: FlowData[];
  zoomLevel: number;
  predictions: Prediction[];
  chartTimeframe: string;
  showLines: boolean;
  isLoading: boolean;
  error: unknown;
  // Control callbacks
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTimeframeChange: (value: string) => void;
  onRefresh: () => void;
  onShowLinesChange: (value: boolean) => void;
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
}) => {
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
  } = usePaginatedCryptos({ flowData, pageSize: 99 });

  // Calculate SVG transform scale based on zoom level
  // Zoom 100% = scale 1.0, zoom 50% = scale 0.5, zoom 150% = scale 1.5
  const systemScale = useMemo(() => {
    return zoomLevel / 100;
  }, [zoomLevel]);

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
      />

      {/* Visualization with zoom transform */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ 
            transform: `scale(${systemScale})`,
          }}
        >
          <FlowVisualization 
            flowData={paginatedData} 
            zoomLevel={100} // Fixed at 100 since we're scaling the container
            predictions={predictions} 
            chartTimeframe={chartTimeframe}
            activeCategory={selectedCategory}
            showLines={showLines}
          />
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-8 left-0 w-full md:w-auto md:left-1/2 md:transform md:-translate-x-1/2 z-10 pointer-events-none">
          <FlowLegend />
        </div>
        
        {/* Legal Disclaimer */}
        <div className="absolute bottom-1 left-2 right-2 z-10">
          <LegalDisclaimer variant="minimal" />
        </div>
      </div>
    </div>
  );
};

export default memo(SolarSystemSection);
