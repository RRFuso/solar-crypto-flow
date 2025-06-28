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
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-black font-bold text-2xl">☀</span>
          </div>
          {/* Solar flare effect */}
          <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full animate-ping"></div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Solar Crypto Capital Flow
          </h2>
          <p className="text-white/60 text-sm">AI-powered market capital movements in real time</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-yellow-400/30 rounded-md">
        <Clock size={14} className="text-yellow-400" />
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