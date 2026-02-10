
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, ChevronLeft, ChevronRight, Filter, ZoomIn, ZoomOut, RefreshCcw, Clock, Lock } from 'lucide-react';
import { PREDEFINED_LISTS, CRYPTO_CATEGORIES } from '../constants/predefinedLists';
import { useTierAccess } from '@/hooks/useTierAccess';

interface SolarSystemControlsProps {
  currentList: string;
  onListChange: (list: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCryptos: number;
  // Zoom controls
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  // Timeframe
  chartTimeframe: string;
  onTimeframeChange: (value: string) => void;
  // Refresh
  onRefresh: () => void;
  // Lines toggle
  showLines: boolean;
  onShowLinesChange: (value: boolean) => void;
}

const TIMEFRAMES = [
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hora' },
  { value: '4h', label: '4 horas' },
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
];

export const SolarSystemControls: React.FC<SolarSystemControlsProps> = ({
  currentList,
  onListChange,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  currentPage,
  totalPages,
  onPageChange,
  totalCryptos,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  chartTimeframe,
  onTimeframeChange,
  onRefresh,
  showLines,
  onShowLinesChange,
}) => {
  const [showCategories, setShowCategories] = useState(false);
  const { tier, showUpgradePrompt } = useTierAccess();
  
  // Categories that require premium access
  const PREMIUM_CATEGORIES = ['rwa', 'depin', 'ai', 'lst', 'oracles', 'cex-token'];
  
  const categoryLabels: Record<string, string> = {
    all: '🌐 Todas',
    layer1: '🔷 Layer 1',
    layer2: '🔶 Layer 2',
    defi: '🏦 DeFi',
    memecoin: '🐕 Memecoins',
    stablecoin: '💵 Stablecoins',
    gaming: '🎮 Gaming',
    ai: '🤖 AI',
    privacy: '🔒 Privacy',
    solana: '☀️ Solana',
    ethereum: '💎 Ethereum',
    bitcoin: '₿ Bitcoin',
    bnb: '🔸 BNB',
    rwa: '🏠 RWA',
    depin: '📡 DePIN',
    oracles: '🔮 Oracles',
    payments: '💳 Payments',
    metaverse: '🌌 Metaverse',
    nft: '🖼️ NFT',
    storage: '💾 Storage',
    infrastructure: '🔗 Infrastructure',
    'cex-token': '🏛️ CEX Token',
    lst: '💧 LST',
  };

  const fixedCoins = ['BTC', ...CRYPTO_CATEGORIES.stablecoin];

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="🔍 Buscar cripto... (ex: BTC, ETH, SOL)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-orange-500"
        />
      </div>

      {/* Filters row - List, Category, Zoom, Timeframe, Lines, Refresh, Pagination */}
      <div className="flex flex-wrap items-center gap-2">
        {/* List Selector */}
        <Select value={currentList} onValueChange={onListChange}>
          <SelectTrigger className="w-[140px] h-8 bg-slate-800/50 border-slate-600/50 text-white text-xs">
            <SelectValue placeholder="Selecionar lista" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 z-50">
            {Object.entries(PREDEFINED_LISTS).map(([key, value]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-slate-700 text-xs">
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(!showCategories)}
          className="h-8 bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700 text-xs"
        >
          <Filter className="h-3 w-3 mr-1" />
          {categoryLabels[selectedCategory] || 'Categoria'}
        </Button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded-md">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 text-white hover:bg-slate-700"
            onClick={onZoomOut}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-white/80 text-xs w-10 text-center">{zoomLevel}%</span>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 text-white hover:bg-slate-700"
            onClick={onZoomIn}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded-md">
          <Clock className="h-3 w-3 text-slate-400" />
          <Select value={chartTimeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-[80px] h-6 border-none bg-transparent text-white/80 px-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 z-50">
              {TIMEFRAMES.map(tf => (
                <SelectItem key={tf.value} value={tf.value} className="text-white hover:bg-slate-700 text-xs">
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lines Toggle */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded-md">
          <Switch
            id="show-lines-control"
            checked={showLines}
            onCheckedChange={onShowLinesChange}
            className="h-4 w-7"
          />
          <Label htmlFor="show-lines-control" className="text-white/80 text-xs cursor-pointer">
            Linhas
          </Label>
        </div>

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="icon"
          className="h-8 w-8 bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700"
          onClick={onRefresh}
        >
          <RefreshCcw className="h-3 w-3" />
        </Button>

        {/* Pagination */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 text-white hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-400 min-w-[70px] text-center">
            {currentPage}/{totalPages} ({totalCryptos})
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 text-white hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category badges (collapsible) */}
      {showCategories && (
        <div className="flex flex-wrap gap-1 py-1 animate-fade-in">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const isPremium = PREMIUM_CATEGORIES.includes(key);
            const isLocked = isPremium && tier === 'free';
            
            return (
              <Badge
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-all ${
                  selectedCategory === key 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : isLocked
                    ? 'bg-slate-800/30 text-slate-500 border-slate-700 hover:bg-slate-700/50'
                    : 'bg-slate-800/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                }`}
                onClick={() => {
                  if (isLocked) {
                    showUpgradePrompt(label);
                    return;
                  }
                  onCategoryChange(key);
                  setShowCategories(false);
                }}
              >
                {label}
                {isLocked && <Lock className="h-3 w-3 ml-1 text-yellow-500" />}
                {isPremium && !isLocked && (
                  <span className="ml-1 text-yellow-400 text-[9px]">★</span>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Fixed coins indicator */}
      <div className="flex items-center gap-1 text-xs text-slate-500 overflow-x-auto">
        <span>📌 Fixos:</span>
        {fixedCoins.map(coin => (
          <Badge key={coin} variant="outline" className="text-[10px] py-0 bg-gray-500/10 text-gray-400 border-gray-500/30">
            {coin}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SolarSystemControls;
