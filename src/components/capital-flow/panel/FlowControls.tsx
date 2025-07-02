
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff } from 'lucide-react';

interface FlowControlsProps {
  zoomLevel: number;
  onZoomChange: (value: number) => void;
  chartTimeframe: string;
  onTimeframeChange: (value: string) => void;
  showSidebarOnly: boolean;
  onToggleSidebar: (value: boolean) => void;
}

export const FlowControls: React.FC<FlowControlsProps> = ({
  zoomLevel,
  onZoomChange,
  showSidebarOnly,
  onToggleSidebar
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-white/60 text-sm">Zoom:</span>
        <Slider
          value={[zoomLevel]}
          onValueChange={(value) => onZoomChange(value[0])}
          max={150}
          min={30}
          step={10}
          className="w-20"
        />
        <span className="text-white/80 text-xs w-8">{zoomLevel}%</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggleSidebar(!showSidebarOnly)}
        className="bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
      >
        {showSidebarOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {showSidebarOnly ? 'Show Solar' : 'AI Only'}
      </Button>
    </div>
  );
};
