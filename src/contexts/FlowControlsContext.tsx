import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FlowControlsContextType {
  timeframe: string;
  chartTimeframe: string;
  zoomLevel: number;
  flowLimit: number;
  selectedCategory: string;
  showOnlyStrongSignals: boolean;
  showLines: boolean;
  dataSource: 'coingecko' | 'binance';
  
  setTimeframe: (value: string) => void;
  setChartTimeframe: (value: string) => void;
  setZoomLevel: (value: number) => void;
  setFlowLimit: (value: number) => void;
  setSelectedCategory: (value: string) => void;
  setShowOnlyStrongSignals: (value: boolean) => void;
  setShowLines: (value: boolean) => void;
  setDataSource: (value: 'coingecko' | 'binance') => void;
  
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleLimitChange: (value: number[]) => void;
}

const FlowControlsContext = createContext<FlowControlsContextType | undefined>(undefined);

export const useFlowControls = () => {
  const context = useContext(FlowControlsContext);
  if (!context) {
    throw new Error('useFlowControls must be used within FlowControlsProvider');
  }
  return context;
};

interface FlowControlsProviderProps {
  children: ReactNode;
}

export const FlowControlsProvider: React.FC<FlowControlsProviderProps> = ({ children }) => {
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(70); // 100% = default scale for solar system
  const [flowLimit, setFlowLimit] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyStrongSignals, setShowOnlyStrongSignals] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [dataSource, setDataSource] = useState<'coingecko' | 'binance'>('coingecko');

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 200)); // Max 200% zoom in
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50)); // Min 50% zoom out
  }, []);

  const handleLimitChange = useCallback((value: number[]) => {
    setFlowLimit(value[0]);
  }, []);

  const value: FlowControlsContextType = {
    timeframe,
    chartTimeframe,
    zoomLevel,
    flowLimit,
    selectedCategory,
    showOnlyStrongSignals,
    showLines,
    dataSource,
    setTimeframe,
    setChartTimeframe,
    setZoomLevel,
    setFlowLimit,
    setSelectedCategory,
    setShowOnlyStrongSignals,
    setShowLines,
    setDataSource,
    handleZoomIn,
    handleZoomOut,
    handleLimitChange,
  };

  return (
    <FlowControlsContext.Provider value={value}>
      {children}
    </FlowControlsContext.Provider>
  );
};
