
import React from 'react';
import { RefreshCcw, ZoomIn, ZoomOut, Filter, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Slider
} from "@/components/ui/slider";

interface FlowControlsProps {
  chartTimeframe: string;
  onChartTimeframeChange: (value: string) => void;
  showOnlyStrongSignals: boolean;
  setShowOnlyStrongSignals: (value: boolean) => void;
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  flowLimit: number;
  handleLimitChange: (value: number[]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onRefresh: () => void;
  showLines: boolean;
  setShowLines: (value: boolean) => void;
}

// Crypto categories
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'layer1', label: 'Layer 1' },
  { value: 'layer2', label: 'Layer 2' },
  { value: 'defi', label: 'DeFi' },
  { value: 'memecoin', label: 'Memecoins' },
  { value: 'stablecoin', label: 'Stablecoins' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'ai', label: 'AI' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'solana', label: 'Solana Chain' },
  { value: 'ethereum', label: 'ETH Chain' },
  { value: 'bitcoin', label: 'BTC Chain' },
  { value: 'bnb', label: 'BNB Chain' },
  { value: 'rwa', label: 'RWA' },
  { value: 'payments', label: 'Payments' },
  { value: 'metaverse', label: 'Metaverse' },
  { value: 'nft', label: 'NFT' },
  { value: 'storage', label: 'Storage' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

const TIMEFRAMES = [
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
];

export const FlowControls: React.FC<FlowControlsProps> = ({
  chartTimeframe,
  onChartTimeframeChange,
  showOnlyStrongSignals,
  setShowOnlyStrongSignals,
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  flowLimit,
  handleLimitChange,
  selectedCategory,
  setSelectedCategory,
  onRefresh,
  showLines,
  setShowLines
}) => {
  return (
    <div className="flex items-center justify-center flex-wrap gap-2 md:gap-4 md:flex-nowrap">
      {/* Strong Signal Filter */}
      <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 bg-white/5 border border-white/10 rounded-md">
        <div className="flex items-center space-x-1 md:space-x-2">
          <Switch
            id="strong-signals"
            checked={showOnlyStrongSignals}
            onCheckedChange={setShowOnlyStrongSignals}
            className="w-6 h-3 md:w-auto md:h-auto"
          />
          <Label htmlFor="strong-signals" className="text-white/80 text-[10px] md:text-xs">
            Strong signals
          </Label>
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 md:gap-2">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/5 border-white/10 hover:bg-white/10 h-7 w-7 md:h-9 md:w-9"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <span className="text-white/80 text-[10px] md:text-xs w-8 md:w-10 text-center">{zoomLevel}%</span>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/5 border-white/10 hover:bg-white/10 h-7 w-7 md:h-9 md:w-9"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>
      
      {/* Flow Limit Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/10 hover:bg-white/10 flex items-center gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
          >
            <Filter className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-[10px] md:text-xs">{flowLimit} Flows</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 md:w-80 bg-gray-900 border-gray-800">
          <div className="space-y-2 md:space-y-4">
            <h4 className="font-medium text-xs md:text-sm text-gray-300">Visible Flows</h4>
            <Slider
              defaultValue={[flowLimit]}
              max={2000}
              min={5}
              step={5}
              onValueChange={handleLimitChange}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] md:text-xs text-gray-400">
              <span>Fewer</span>
              <span>More</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 bg-white/5 border border-white/10 rounded-md">
        <Clock size={12} className="text-gray-400 md:w-4 md:h-4" />
        <Select value={chartTimeframe} onValueChange={onChartTimeframeChange}>
          <SelectTrigger className="w-20 md:w-24 border-none bg-transparent text-white/80 h-6 py-0 px-1 text-[10px] md:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            {TIMEFRAMES.map(tf => (
              <SelectItem key={tf.value} value={tf.value} className="text-xs md:text-sm">{tf.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-28 md:w-40 h-7 md:h-9 bg-white/5 border-white/10 text-[10px] md:text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-800">
          {CATEGORIES.map(category => (
            <SelectItem key={category.value} value={category.value} className="text-xs md:text-sm">
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Refresh Button */}
      <Button 
        variant="outline" 
        size="icon"
        className="bg-white/5 border-white/10 hover:bg-white/10 h-7 w-7 md:h-9 md:w-9"
        onClick={onRefresh}
      >
        <RefreshCcw className="h-3 w-3 md:h-4 md:w-4" />
      </Button>

      {/* Lines Toggle */}
      <div className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 bg-white/5 border border-white/10 rounded-md">
        <div className="flex items-center space-x-1 md:space-x-2">
          <Switch
            id="show-lines"
            checked={showLines}
            onCheckedChange={setShowLines}
            className="w-6 h-3 md:w-auto md:h-auto"
          />
          <Label htmlFor="show-lines" className="text-white/80 text-[10px] md:text-xs">
            Lines
          </Label>
        </div>
      </div>
    </div>
  );
};
