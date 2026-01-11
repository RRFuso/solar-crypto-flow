
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { PREDEFINED_LISTS, CRYPTO_CATEGORIES } from '../constants/predefinedLists';

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
}

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
}) => {
  const [showCategories, setShowCategories] = useState(false);
  
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
    payments: '💳 Payments',
    metaverse: '🌌 Metaverse',
    nft: '🖼️ NFT',
    storage: '💾 Storage',
    infrastructure: '🔗 Infrastructure',
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

      {/* List selector and pagination */}
      <div className="flex flex-wrap items-center gap-2">
        {/* List Selector */}
        <Select value={currentList} onValueChange={onListChange}>
          <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-600/50 text-white">
            <SelectValue placeholder="Selecionar lista" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {Object.entries(PREDEFINED_LISTS).map(([key, value]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
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
          className="bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700"
        >
          <Filter className="h-4 w-4 mr-1" />
          {categoryLabels[selectedCategory] || 'Categoria'}
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
          <span className="text-sm text-slate-400 min-w-[80px] text-center">
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
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Badge
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              className={`cursor-pointer text-xs transition-all ${
                selectedCategory === key 
                  ? 'bg-orange-500 text-white border-orange-500' 
                  : 'bg-slate-800/50 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
              onClick={() => {
                onCategoryChange(key);
                setShowCategories(false);
              }}
            >
              {label}
            </Badge>
          ))}
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
