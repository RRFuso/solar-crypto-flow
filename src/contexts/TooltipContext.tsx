import { CapitalFlowLink } from '@/types/capitalFlow';
import { Prediction } from '@/lib/aiModel';
import React, { createContext, useState, useContext, useCallback } from 'react';

interface TooltipData {
  id: string;
  name?: string;
  price?: number;
  priceChange24h?: number;
  volume?: number;
  capitalFlows?: CapitalFlowLink[];
  aiModel?: Prediction;
  trendReasons?: string[];
  aiAnalysis?: {
    recommendation: string;
    confidence: number;
  };
  explosivePotential?: string;
  keyFactors?: string[];
}

interface TooltipContextType {
  tooltipData: TooltipData | null;
  tooltipPosition: { x: number; y: number };
  isTooltipVisible: boolean;
  showTooltip: (data: TooltipData, position: { x: number; y: number }) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const showTooltip = useCallback((data: TooltipData, position: { x: number; y: number }) => {
    setTooltipData(data);
    setTooltipPosition(position);
    setIsTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsTooltipVisible(false);
    // We can delay clearing the data to prevent flickering
    setTimeout(() => setTooltipData(null), 200);
  }, []);

  return (
    <TooltipContext.Provider value={{ tooltipData, tooltipPosition, isTooltipVisible, showTooltip, hideTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = (): TooltipContextType => {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};