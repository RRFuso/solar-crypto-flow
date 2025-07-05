
import React, { useState, useEffect } from 'react';
import { getLogoUrls } from '@/lib/cryptoLogos';

interface CryptoLogoProps {
  symbol: string;
  className?: string;
}

const CryptoLogo: React.FC<CryptoLogoProps> = ({ symbol, className }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const urls = getLogoUrls(symbol);
    let currentUrlIndex = 0;

    const tryNextUrl = () => {
      if (currentUrlIndex < urls.length) {
        const img = new Image();
        img.src = urls[currentUrlIndex];
        img.onload = () => {
          setLogoUrl(urls[currentUrlIndex]);
        };
        img.onerror = () => {
          currentUrlIndex++;
          tryNextUrl();
        };
      }
    };

    tryNextUrl();
  }, [symbol]);

  if (!logoUrl) {
    // You can return a placeholder or skeleton here while loading
    return <div className={`bg-gray-700 rounded-full ${className}`} />;
  }

  return <img src={logoUrl} alt={`${symbol} logo`} className={className} />;
};

export default CryptoLogo;
