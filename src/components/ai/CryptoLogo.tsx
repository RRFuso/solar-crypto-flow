
import React, { useState, useEffect } from 'react';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { supabase } from '@/integrations/supabase/client';

interface CryptoLogoProps {
  symbol: string;
  className?: string;
}

const CryptoLogo: React.FC<CryptoLogoProps> = ({ symbol, className }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      // First, try to get from cache
      const { data: cached } = await supabase
        .from('cached_crypto_logos')
        .select('storage_path')
        .eq('symbol', symbol.toUpperCase())
        .single();

      if (cached) {
        const { data: publicUrl } = supabase.storage
          .from('crypto-logos')
          .getPublicUrl(cached.storage_path);
        setLogoUrl(publicUrl.publicUrl);
        return;
      }

      // If not cached, try URLs with fallback
      const urls = getLogoUrls(symbol);
      let currentUrlIndex = 0;

      const tryNextUrl = () => {
        if (currentUrlIndex < urls.length) {
          const img = new Image();
          img.src = urls[currentUrlIndex];
          img.onload = () => {
            setLogoUrl(urls[currentUrlIndex]);
            // Trigger background caching for next time (only for external URLs, not fallback SVG)
            if (currentUrlIndex > 0 && !urls[currentUrlIndex].startsWith('data:')) {
              supabase.functions.invoke('cache-crypto-logo', {
                body: { symbol: symbol.toUpperCase() }
              }).catch(() => {}); // Silent fail, it's just for caching
            }
          };
          img.onerror = () => {
            currentUrlIndex++;
            tryNextUrl();
          };
        }
      };

      tryNextUrl();
    };

    loadLogo();
  }, [symbol]);

  if (!logoUrl) {
    // You can return a placeholder or skeleton here while loading
    return <div className={`bg-gray-700 rounded-full ${className}`} />;
  }

  return <img src={logoUrl} alt={`${symbol} logo`} className={className} />;
};

export default CryptoLogo;
