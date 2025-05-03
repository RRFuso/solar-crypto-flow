
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
      <div className="flex items-center gap-3">
        <img 
          src="/lovable-uploads/8b011f9d-f3aa-4409-8750-9bd757d934fc.png" 
          alt="SolarCrypto Logo" 
          className="h-12 object-contain"
        />
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white">Crypto Capital Flow</h2>
          <p className="text-white/60 text-sm">Market capital movements in real time</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md">
        <Clock size={14} className="text-gray-400" />
        <Select value={chartTimeframe} onValueChange={onChartTimeframeChange}>
          <SelectTrigger className="w-24 border-none bg-transparent text-white/80 h-6 py-0 px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            {TIMEFRAMES.map(tf => (
              <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
