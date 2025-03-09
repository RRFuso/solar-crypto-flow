
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CryptoLogosContextType {
  logos: Record<string, string>;
  addLogo: (symbol: string, url: string) => void;
  getLogo: (symbol: string) => string;
}

const DEFAULT_LOGO = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';

// Create context with default values
const CryptoLogosContext = createContext<CryptoLogosContextType>({
  logos: {},
  addLogo: () => {},
  getLogo: () => DEFAULT_LOGO,
});

export const CryptoLogosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logos, setLogos] = useState<Record<string, string>>({});

  // Function to add a logo to the cache
  const addLogo = (symbol: string, url: string) => {
    if (!logos[symbol]) {
      setLogos(prev => ({ ...prev, [symbol]: url }));
    }
  };

  // Function to get a logo from the cache with fallback
  const getLogo = (symbol: string): string => {
    // CoinMarketCap IDs for common symbols
    const symbolToId: Record<string, number> = {
      'BTC': 1,
      'ETH': 1027,
      'SOL': 5426,
      'BNB': 1839,
      'XRP': 52,
      'ADA': 2010,
      'AVAX': 5805,
      'DOT': 6636,
      'DOGE': 74,
      'MATIC': 3890,
      'LINK': 1975,
      'UNI': 7083,
      'SHIB': 5994,
      'TRX': 1958,
      'TON': 11419,
      'ICP': 8916,
      'NEAR': 6535,
      'APT': 21794,
      'ARB': 11841,
      'OP': 11840,
      'FIL': 2280,
      'PENDLE': 8409,
      'JUP': 25147,
      'FET': 3773,
      'OCEAN': 3840,
      'AGIX': 2424,
      'AAVE': 7278,
      'MKR': 1518,
      'CRV': 6538,
      'COMP': 5692,
      'SNX': 2586,
      'LDO': 8000,
      'RUNE': 4157,
      'FXS': 6953
    };
    
    if (logos[symbol]) {
      return logos[symbol];
    }
    
    // Try to generate a CoinMarketCap URL if we know the ID
    if (symbolToId[symbol]) {
      const logoUrl = `https://s2.coinmarketcap.com/static/img/coins/64x64/${symbolToId[symbol]}.png`;
      // Add to cache for future use
      addLogo(symbol, logoUrl);
      return logoUrl;
    }
    
    // Fallback options
    const fallbackOptions = [
      `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol}.svg`,
      `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`
    ];
    
    // Add a random fallback to cache to avoid repeated failed attempts
    const fallbackUrl = fallbackOptions[0]; 
    addLogo(symbol, fallbackUrl);
    return fallbackUrl;
  };

  return (
    <CryptoLogosContext.Provider value={{ logos, addLogo, getLogo }}>
      {children}
    </CryptoLogosContext.Provider>
  );
};

// Custom hook to use the logos context
export const useCryptoLogos = () => useContext(CryptoLogosContext);
