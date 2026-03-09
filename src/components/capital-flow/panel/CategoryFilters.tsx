
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryClick: (category: string) => void;
}

// Crypto categories (same as in FlowControls)
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

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  activeCategory,
  onCategoryClick
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <Badge 
        className={`cursor-pointer hover:bg-white/20 ${activeCategory === 'all' ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}
        onClick={() => onCategoryClick('all')}
      >
        All Categories
      </Badge>
      {CATEGORIES.filter(c => c.value !== 'all').map(category => (
        <Badge 
          key={category.value}
          className={`cursor-pointer hover:bg-white/20 ${activeCategory === category.value ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}
          onClick={() => onCategoryClick(category.value)}
        >
          {category.label}
        </Badge>
      ))}
    </div>
  );
};
