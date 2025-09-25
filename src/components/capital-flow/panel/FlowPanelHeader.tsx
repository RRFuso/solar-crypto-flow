
import React from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface FlowPanelHeaderProps {
  chartTimeframe: string;
  onChartTimeframeChange: (value: string) => void;
}

const TIMEFRAMES = [
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
];

export const FlowPanelHeader: React.FC<FlowPanelHeaderProps> = ({
  chartTimeframe,
  onChartTimeframeChange
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Timeframe selector will be moved to FlowControls */}
    </div>
  );
};
