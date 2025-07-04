
import React from 'react';
import { RefreshCcw, ZoomIn, ZoomOut, Filter } from 'lucide-react';
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

export const FlowControls: React.FC<FlowControlsProps> = ({
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
    <div className="flex items-center gap-4">
      {/* Strong Signal Filter */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md">
        <div className="flex items-center space-x-2">
          <Switch
            id="strong-signals"
            checked={showOnlyStrongSignals}
            onCheckedChange={setShowOnlyStrongSignals}
          />
          <Label htmlFor="strong-signals" className="text-white/80 text-xs">
            Strong signals only
          </Label>
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 mr-2">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/5 border-white/10 hover:bg-white/10"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-white/80 text-xs w-10 text-center">{zoomLevel}%</span>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/5 border-white/10 hover:bg-white/10"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Flow Limit Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/10 hover:bg-white/10 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="text-xs">{flowLimit} Flows</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-gray-900 border-gray-800">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-300">Visible Flows</h4>
            <Slider
              defaultValue={[flowLimit]}
              max={100}
              min={5}
              step={5}
              onValueChange={handleLimitChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5 (Less clutter)</span>
              <span>100 (More detail)</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-40 bg-white/5 border-white/10">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-800">
          {CATEGORIES.map(category => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Refresh Button */}
      <Button 
        variant="outline" 
        size="icon"
        className="bg-white/5 border-white/10 hover:bg-white/10"
        onClick={onRefresh}
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>

      {/* Lines Toggle */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-lines"
            checked={showLines}
            onCheckedChange={setShowLines}
          />
          <Label htmlFor="show-lines" className="text-white/80 text-xs">
            Lines On/Off
          </Label>
        </div>
      </div>
    </div>
  );
};
