import { useMemo, useState, useCallback } from 'react';
import { FlowData } from '@/types/crypto';
import { CRYPTO_CATEGORIES, belongsToCategory, isDynamicList } from '@/components/capital-flow/constants/predefinedLists';

interface UsePaginatedCryptosOptions {
  flowData: FlowData[];
  pageSize?: number;
  initialList?: string;
}

interface UsePaginatedCryptosResult {
  paginatedData: FlowData[];
  currentPage: number;
  totalPages: number;
  totalCryptos: number;
  currentList: string;
  selectedCategory: string;
  searchTerm: string;
  setCurrentList: (list: string) => void;
  setSelectedCategory: (category: string) => void;
  setSearchTerm: (term: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

// Descriptions shown to users when a dynamic filter is active
export const DYNAMIC_LIST_DESCRIPTIONS: Record<string, string> = {
  'volume-spike': 'Ordenado por Giro de Capital (Volume/MCap)',
  'gainers': 'Maiores altas 24h',
  'losers': 'Maiores quedas 24h',
  'attention': 'Hot Score: volatilidade × volume × ranking',
  'new-listings': 'Tokens menores / listados recentemente',
};

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

  // Deduplicate flows: keep only one flow per primary symbol, with highest value
  const deduplicatedData = useMemo(() => {
    if (!flowData || flowData.length === 0) return [];

    // Build a map: primary symbol → best flow (highest absolute value)
    const stableSet = new Set(CRYPTO_CATEGORIES.stablecoin);
    const symbolMap = new Map<string, FlowData>();

    for (const flow of flowData) {
      const primary = (flow.from === 'BTC' || stableSet.has(flow.from)) ? flow.to : flow.from;
      const existing = symbolMap.get(primary);
      if (!existing || Math.abs(flow.value) > Math.abs(existing.value)) {
        symbolMap.set(primary, flow);
      }
    }

    return Array.from(symbolMap.values());
  }, [flowData]);

  // Sort all data by market cap descending for rank-based pagination
  const rankedData = useMemo(() => {
    return [...deduplicatedData].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }, [deduplicatedData]);

  // Filter and sort data based on current list type
  const filteredData = useMemo(() => {
    let result = [...rankedData];

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.from.toLowerCase().includes(lowerSearch) ||
        item.to.toLowerCase().includes(lowerSearch) ||
        (item.name || '').toLowerCase().includes(lowerSearch)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item =>
        belongsToCategory(item.from, selectedCategory) ||
        belongsToCategory(item.to, selectedCategory)
      );
    }

    // Apply list-specific filtering and sorting
    switch (currentList) {
      // ─── Rank-based pages (use pre-sorted rankedData) ───
      case 'top-100':
        result = result.slice(0, 100);
        break;
      case 'top-200':
        result = result.slice(100, 200);
        break;
      case 'top-300':
        result = result.slice(200, 300);
        break;
      case 'top-400':
        result = result.slice(300, 400);
        break;
      case 'top-500':
        result = result.slice(400, 500);
        break;
      case 'top-600':
        result = result.slice(500, 600);
        break;
      case 'top-700':
        result = result.slice(600, 700);
        break;
      case 'top-800':
        result = result.slice(700, 800);
        break;
      case 'top-900':
        result = result.slice(800, 900);
        break;
      case 'top-1000':
        result = result.slice(900, 1000);
        break;

      // ─── Dynamic strategic lists ───
      case 'volume-spike': {
        // Volume Turnover Ratio: volume_24h / market_cap
        result = result
          .filter(item => (item.volume || 0) > 0 && (item.marketCap || 0) > 0)
          .sort((a, b) => {
            const ratioA = (a.volume || 0) / (a.marketCap || 1);
            const ratioB = (b.volume || 0) / (b.marketCap || 1);
            return ratioB - ratioA;
          });
        break;
      }
      case 'gainers': {
        result = result
          .filter(item => (item.change || 0) > 0)
          .sort((a, b) => (b.change || 0) - (a.change || 0));
        break;
      }
      case 'losers': {
        result = result
          .filter(item => (item.change || 0) < 0)
          .sort((a, b) => (a.change || 0) - (b.change || 0));
        break;
      }
      case 'attention': {
        // Hot Score = (abs(change) * 0.5) + (log10(volume) * 0.3) + (1/rank * 0.2)
        result = result
          .filter(item => (item.volume || 0) > 0)
          .map((item, index) => {
            const rankInverse = 1 / Math.max(index + 1, 1);
            const hotScore =
              (Math.abs(item.change || 0) * 0.5) +
              (Math.log10(Math.max(item.volume || 1, 1)) * 0.3) +
              (rankInverse * 0.2 * 100); // scale rank component
            return { ...item, _hotScore: hotScore };
          })
          .sort((a, b) => ((b as any)._hotScore || 0) - ((a as any)._hotScore || 0));
        break;
      }
      case 'new-listings': {
        // Smallest market cap first (proxy for newer projects)
        result = result
          .filter(item => (item.marketCap || 0) > 0)
          .sort((a, b) => (a.marketCap || 0) - (b.marketCap || 0))
          .slice(0, 100);
        break;
      }
      default:
        // Default: already sorted by market cap desc
        break;
    }

    return result;
  }, [rankedData, searchTerm, selectedCategory, currentList]);

  // Extract unique symbols with fixed coins always included
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set<string>();
    fixedCoins.forEach(coin => symbols.add(coin));
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
    const nonFixedSymbols = uniqueSymbols.filter(s => !fixedCoins.includes(s));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageSymbols = new Set([
      ...fixedCoins,
      ...nonFixedSymbols.slice(startIndex, endIndex)
    ]);

    return filteredData.filter(item =>
      pageSymbols.has(item.from) || pageSymbols.has(item.to)
    );
  }, [filteredData, uniqueSymbols, currentPage, pageSize, fixedCoins]);

  // Navigation actions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

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
