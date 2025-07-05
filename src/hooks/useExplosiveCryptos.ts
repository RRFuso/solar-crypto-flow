import { useState, useEffect } from 'react';

interface ExplosiveCrypto {
  symbol: string;
  factors: string[];
}

export const useExplosiveCryptos = () => {
  const [explosiveCryptos, setExplosiveCryptos] = useState<ExplosiveCrypto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplosiveCryptos = async () => {
      setLoading(true);
      // In a real application, this would fetch data from an API
      // For now, we'll use mock data
      const mockData: ExplosiveCrypto[] = [
        { symbol: 'BTC', factors: ['Volume breakout', 'High social sentiment'] },
        { symbol: 'ETH', factors: ['RSI divergence', 'MACD cross'] },
        { symbol: 'SOL', factors: ['New narrative', 'Exchange listing'] },
      ];
      setExplosiveCryptos(mockData);
      setLoading(false);
    };

    fetchExplosiveCryptos();
  }, []);

  return { explosiveCryptos, loading };
};