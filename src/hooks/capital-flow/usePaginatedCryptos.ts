
import { useMemo, useState, useCallback } from 'react';
import { FlowData } from '@/types/crypto';
import { CRYPTO_CATEGORIES, getCategoryForSymbol, belongsToCategory } from '@/components/capital-flow/constants/predefinedLists';

interface UsePaginatedCryptosOptions {
  flowData: FlowData[];
  pageSize?: number;
  initialList?: string;
}

interface UsePaginatedCryptosResult {
  // Current page data
  paginatedData: FlowData[];
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalCryptos: number;
  
  // Current list/filter
  currentList: string;
  selectedCategory: string;
  searchTerm: string;
  
  // Actions
  setCurrentList: (list: string) => void;
  setSelectedCategory: (category: string) => void;
  setSearchTerm: (term: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePaginatedCryptos({
  flowData,
  pageSize = 99,
  initialList = 'top-100',
}: UsePaginatedCryptosOptions): UsePaginatedCryptosResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentList, setCurrentList] = useState(initialList);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fixedCoins = useMemo(() => ['BTC', ...CRYPTO_CATEGORIES.stablecoin], []);

  // Filter and sort data based on current list type
  const filteredData = useMemo(() => {
    if (!flowData || flowData.length === 0) return [];

    let result = [...flowData];

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.from.toLowerCase().includes(lowerSearch) ||
        item.to.toLowerCase().includes(lowerSearch) ||
        (item as any).name?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => 
        belongsToCategory(item.from, selectedCategory) ||
        belongsToCategory(item.to, selectedCategory)
      );
    }

    // Apply list-specific sorting
    switch (currentList) {
      case 'volume-spike':
        result = result.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        break;
      case 'gainers':
        result = result.sort((a, b) => (b.change || 0) - (a.change || 0));
        break;
      case 'losers':
        result = result.sort((a, b) => (a.change || 0) - (b.change || 0));
        break;
      case 'attention':
        // Sort by combination of volume and price change
        result = result.sort((a, b) => {
          const scoreA = Math.abs(a.change || 0) * (a.volume || 1);
          const scoreB = Math.abs(b.change || 0) * (b.volume || 1);
          return scoreB - scoreA;
        });
        break;
      default:
        // Default: sort by market cap (value/flow amount)
        result = result.sort((a, b) => (b.value || 0) - (a.value || 0));
    }

    return result;
  }, [flowData, searchTerm, selectedCategory, currentList]);

  // Extract unique symbols with fixed coins always included
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set<string>();
    
    // Always add fixed coins first
    fixedCoins.forEach(coin => symbols.add(coin));
    
    // Add symbols from filtered data
    filteredData.forEach(item => {
      symbols.add(item.from);
      symbols.add(item.to);
    });
    
    return Array.from(symbols);
  }, [filteredData, fixedCoins]);

  // Calculate pagination
  const totalCryptos = uniqueSymbols.length;
  const totalPages = Math.max(1, Math.ceil((totalCryptos - fixedCoins.length) / pageSize));

  // Get paginated data
  const paginatedData = useMemo(() => {
    // Get the symbols for current page (excluding fixed coins from pagination)
    const nonFixedSymbols = uniqueSymbols.filter(s => !fixedCoins.includes(s));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageSymbols = new Set([
      ...fixedCoins,
      ...nonFixedSymbols.slice(startIndex, endIndex)
    ]);

    // Filter flow data to only include items with symbols in current page
    return filteredData.filter(item => 
      pageSymbols.has(item.from) || pageSymbols.has(item.to)
    );
  }, [filteredData, uniqueSymbols, currentPage, pageSize, fixedCoins]);

  // Navigation actions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset page when filters change
  const handleListChange = useCallback((list: string) => {
    setCurrentList(list);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalCryptos,
    currentList,
    selectedCategory,
    searchTerm,
    setCurrentList: handleListChange,
    setSelectedCategory: handleCategoryChange,
    setSearchTerm: handleSearchChange,
    goToPage,
    nextPage,
    prevPage,
  };
}
