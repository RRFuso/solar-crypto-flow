import { useMemo, useState, useCallback, useEffect } from 'react';
import { FlowData } from '@/types/crypto';
import { CRYPTO_CATEGORIES, belongsToCategory, isDynamicList } from '@/components/capital-flow/constants/predefinedLists';

interface UsePaginatedCryptosOptions {
  flowData: FlowData[];
  pageSize?: number;
  initialList?: string;
  // External control from Oracle / parent
  externalCategory?: string;
  externalList?: string;
  externalSymbols?: string[];
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

// Build a minimal placeholder FlowData so a symbol always shows in the canvas
function makePlaceholder(symbol: string): FlowData {
  return {
    id: `placeholder-${symbol}`,
    from: symbol,
    to: 'BTC',
    value: 0,
    percentage: 0,
    marketCap: 0,
    volume: 0,
    name: symbol,
    change: 0,
  } as FlowData;
}

export function usePaginatedCryptos({
  flowData,
  pageSize = 99,
  initialList = 'top-100',
  externalCategory,
  externalList,
  externalSymbols,
}: UsePaginatedCryptosOptions): UsePaginatedCryptosResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentList, setCurrentListState] = useState(initialList);
  const [selectedCategory, setSelectedCategoryState] = useState('all');
  const [searchTerm, setSearchTermState] = useState('');

  // ── React to external Oracle commands ────────────────────────────────────
  useEffect(() => {
    if (externalCategory && externalCategory !== selectedCategory) {
      setSelectedCategoryState(externalCategory);
      setCurrentPage(1);
    }
  }, [externalCategory]);

  useEffect(() => {
    if (externalList && externalList !== currentList) {
      setCurrentListState(externalList);
      setCurrentPage(1);
    }
  }, [externalList]);

  // ─────────────────────────────────────────────────────────────────────────

  const fixedCoins = useMemo(() => ['BTC', ...CRYPTO_CATEGORIES.stablecoin], []);

  // Deduplicate flows: keep only one flow per primary symbol, with highest value
  const deduplicatedData = useMemo(() => {
    if (!flowData || flowData.length === 0) return [];
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

  // Sort all data by market cap descending
  const rankedData = useMemo(() => {
    return [...deduplicatedData].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }, [deduplicatedData]);

  // Filter and sort
  const filteredData = useMemo(() => {
    let result = [...rankedData];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.from.toLowerCase().includes(lower) ||
        item.to.toLowerCase().includes(lower) ||
        (item.name || '').toLowerCase().includes(lower)
      );
    }

    // ── Category filter + RECRUIT missing symbols ─────────────────────────
    if (selectedCategory !== 'all') {
      result = result.filter(item =>
        belongsToCategory(item.from, selectedCategory) ||
        belongsToCategory(item.to, selectedCategory)
      );

      // Ensure ALL symbols of the category appear, even if absent from flowData
      const categorySymbols = CRYPTO_CATEGORIES[selectedCategory] ?? [];
      const presentSymbols = new Set<string>();
      result.forEach(f => { presentSymbols.add(f.from); presentSymbols.add(f.to); });

      const missing = categorySymbols.filter(s => !presentSymbols.has(s) && s !== 'BTC');
      if (missing.length > 0) {
        result = [...result, ...missing.map(makePlaceholder)];
      }
    }

    // ── Oracle pinned symbols: ensure they appear ─────────────────────────
    if (externalSymbols && externalSymbols.length > 0) {
      const presentSymbols = new Set<string>();
      result.forEach(f => { presentSymbols.add(f.from); presentSymbols.add(f.to); });
      const missing = externalSymbols.filter(s => !presentSymbols.has(s) && s !== 'BTC');
      if (missing.length > 0) {
        result = [...result, ...missing.map(makePlaceholder)];
      }
    }

    // ── List-specific sorting ─────────────────────────────────────────────
    switch (currentList) {
      case 'top-100':   result = result.slice(0, 100); break;
      case 'top-200':   result = result.slice(100, 200); break;
      case 'top-300':   result = result.slice(200, 300); break;
      case 'top-400':   result = result.slice(300, 400); break;
      case 'top-500':   result = result.slice(400, 500); break;
      case 'top-600':   result = result.slice(500, 600); break;
      case 'top-700':   result = result.slice(600, 700); break;
      case 'top-800':   result = result.slice(700, 800); break;
      case 'top-900':   result = result.slice(800, 900); break;
      case 'top-1000':  result = result.slice(900, 1000); break;

      case 'volume-spike': {
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
        result = result
          .filter(item => (item.volume || 0) > 0)
          .map((item, index) => {
            const rankInverse = 1 / Math.max(index + 1, 1);
            const hotScore =
              (Math.abs(item.change || 0) * 0.5) +
              (Math.log10(Math.max(item.volume || 1, 1)) * 0.3) +
              (rankInverse * 0.2 * 100);
            return { ...item, _hotScore: hotScore };
          })
          .sort((a, b) => ((b as any)._hotScore || 0) - ((a as any)._hotScore || 0));
        break;
      }
      case 'new-listings': {
        result = result
          .filter(item => (item.marketCap || 0) > 0)
          .sort((a, b) => (a.marketCap || 0) - (b.marketCap || 0))
          .slice(0, 100);
        break;
      }
      default:
        break;
    }

    return result;
  }, [rankedData, searchTerm, selectedCategory, currentList, externalSymbols]);

  // Unique symbols with fixed coins always included
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set<string>();
    fixedCoins.forEach(coin => symbols.add(coin));
    filteredData.forEach(item => {
      symbols.add(item.from);
      symbols.add(item.to);
    });
    return Array.from(symbols);
  }, [filteredData, fixedCoins]);

  const totalCryptos = uniqueSymbols.length;
  const totalPages = Math.max(1, Math.ceil((totalCryptos - fixedCoins.length) / pageSize));

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

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const setCurrentList = useCallback((list: string) => {
    setCurrentListState(list);
    setCurrentPage(1);
  }, []);

  const setSelectedCategory = useCallback((category: string) => {
    setSelectedCategoryState(category);
    setCurrentPage(1);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
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
    setCurrentList,
    setSelectedCategory,
    setSearchTerm,
    goToPage,
    nextPage,
    prevPage,
  };
}
