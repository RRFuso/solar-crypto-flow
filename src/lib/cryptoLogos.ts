
/**
 * Provides functions to fetch cryptocurrency logos from various sources
 */

// Primary CDN for crypto logos
export const getCryptoLogoUrl = (symbol: string): string => {
  if (!symbol) return getFallbackLogoUrl();
  return `https://cryptoicon-api.vercel.app/api/icon/${symbol.toLowerCase()}`;
};

// Secondary CDN as a backup
export const getAlternativeLogoUrl = (symbol: string): string => {
  if (!symbol) return getFallbackLogoUrl();
  return `https://cryptocurrencyliveprices.com/img/${symbol.toLowerCase()}.png`;
};

// Fallback image for when no crypto logo is available
export const getFallbackLogoUrl = (): string => {
  return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&q=80';
};
