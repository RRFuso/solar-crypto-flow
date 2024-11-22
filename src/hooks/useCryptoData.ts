import { useQuery } from '@tanstack/react-query';

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
}

const fetchCryptoData = async (): Promise<CryptoData[]> => {
  // In a real implementation, this would fetch from Binance/TradingView API
  // For now, using mock data to demonstrate the functionality
  return [
    { id: 'BTC', name: 'Bitcoin', performance: 0, rsi: 45.2, rsi4h: 42.5 },
    { id: 'ETH', name: 'Ethereum', performance: -12.5, rsi: 42.8, rsi4h: 38.6 },
    { id: 'SOL', name: 'Solana', performance: 45.2, rsi: 72.4, rsi4h: 22.4 },
    { id: 'JUP', name: 'Jupiter', performance: 156.7, rsi: 82.6, rsi4h: 18.9 },
    { id: 'ICP', name: 'Internet Computer', performance: 89.3, rsi: 65.8, rsi4h: 24.3 },
    { id: 'KAS', name: 'Kaspa', performance: 234.1, rsi: 78.2, rsi4h: 21.8 },
    { id: 'PENDLE', name: 'Pendle', performance: 167.3, rsi: 68.9, rsi4h: 19.5 },
    { id: 'OM', name: 'Mantra', performance: 78.4, rsi: 58.3, rsi4h: 23.7 },
    { id: 'INJ', name: 'Injective', performance: 321.5, rsi: 85.7, rsi4h: 17.2 },
    { id: 'SUI', name: 'Sui', performance: 145.8, rsi: 75.4, rsi4h: 20.1 },
    { id: 'SEI', name: 'Sei', performance: 178.9, rsi: 70.2, rsi4h: 22.8 },
    { id: 'AVAX', name: 'Avalanche', performance: 67.2, rsi: 63.5, rsi4h: 25.6 },
    { id: 'MATIC', name: 'Polygon', performance: 23.4, rsi: 52.8, rsi4h: 28.4 },
    { id: 'LINK', name: 'Chainlink', performance: 45.6, rsi: 61.3, rsi4h: 26.7 },
    { id: 'NEAR', name: 'Near Protocol', performance: 56.7, rsi: 64.2, rsi4h: 23.9 },
    { id: 'RENDER', name: 'Render', performance: 89.2, rsi: 69.7, rsi4h: 21.3 },
    { id: 'FLOKI', name: 'Floki Inu', performance: 234.5, rsi: 82.1, rsi4h: 19.8 },
    { id: 'PEPE', name: 'Pepe', performance: 345.6, rsi: 88.4, rsi4h: 16.5 },
    { id: 'WIF', name: 'Wif', performance: 456.7, rsi: 86.9, rsi4h: 15.8 },
    { id: 'DOGE', name: 'Dogecoin', performance: 123.4, rsi: 75.6, rsi4h: 24.2 },
    { id: 'BONK', name: 'Bonk', performance: 567.8, rsi: 89.3, rsi4h: 14.7 },
    { id: 'SHIB', name: 'Shiba Inu', performance: 234.5, rsi: 80.2, rsi4h: 20.4 },
    { id: 'MEME', name: 'Memecoin', performance: 345.6, rsi: 85.8, rsi4h: 17.9 },
    { id: 'DOGWIFHAT', name: 'Dog Wif Hat', performance: 456.7, rsi: 87.5, rsi4h: 16.2 },
    { id: 'WOJAK', name: 'Wojak', performance: 234.5, rsi: 79.4, rsi4h: 21.6 },
    { id: 'MYRO', name: 'Myro', performance: 345.6, rsi: 83.7, rsi4h: 18.3 },
    { id: 'TOSHI', name: 'Toshi', performance: 456.7, rsi: 84.9, rsi4h: 17.5 },
  ];
};

export const useCryptoData = () => {
  return useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
  });
};
