
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

// Crypto categories principais para exibição horizontal
const MAIN_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'layer1', label: 'L1' },
  { value: 'layer2', label: 'L2' },
  { value: 'defi', label: 'DeFi' },
  { value: 'memecoin', label: 'Meme' },
  { value: 'ai', label: 'AI' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'rwa', label: 'RWA' },
];

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  activeCategory,
  onCategoryChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/60 text-sm mr-2">Categories:</span>
      <div className="flex gap-1.5">
        {MAIN_CATEGORIES.map(category => (
          <Badge 
            key={category.value}
            className={`cursor-pointer hover:bg-white/20 text-xs px-2 py-1 transition-all ${
              activeCategory === category.value 
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-medium' 
                : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
            }`}
            onClick={() => onCategoryChange(category.value)}
          >
            {category.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
