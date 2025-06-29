
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from 'lucide-react';

interface NarrativeControlsProps {
  timeframe: string;
  usePredictions: boolean;
  onTimeframeChange: (value: string) => void;
  onPredictionsChange: (checked: boolean) => void;
  onRefresh: () => void;
}

export const NarrativeControls: React.FC<NarrativeControlsProps> = ({
  timeframe,
  usePredictions,
  onTimeframeChange,
  onPredictionsChange,
  onRefresh
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch 
          id="predictions-switch" 
          checked={usePredictions} 
          onCheckedChange={onPredictionsChange} 
        />
        <Label htmlFor="predictions-switch" className="text-sm text-white/80">
          AI Predictions
        </Label>
      </div>
      <Select value={timeframe} onValueChange={onTimeframeChange}>
        <SelectTrigger className="w-32 bg-white/5 border-white/10">
          <SelectValue placeholder="Timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">24 Hours</SelectItem>
          <SelectItem value="7d">7 Days</SelectItem>
          <SelectItem value="30d">30 Days</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="icon"
        className="bg-white/5 border-white/10 hover:bg-white/10"
        onClick={onRefresh}
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
