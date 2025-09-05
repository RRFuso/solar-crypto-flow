// Utility to clear market data cache when configuration changes
export const clearMarketDataCache = () => {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('market-data-')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('Market data cache cleared');
};

// Clear cache on first load to ensure new config takes effect
if (typeof window !== 'undefined') {
  clearMarketDataCache();
}