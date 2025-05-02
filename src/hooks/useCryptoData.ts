import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CryptoData } from '@/types/crypto';
import { fetchTickers } from '@/lib/binance';

const fallbackData: CryptoData[] = [
  { id: 'BTC', name: 'Bitcoin', performance: 2.5, price: '48000', rsi: 55, rsi4h: 58 },
  { id: 'ETH', name: 'Ethereum', performance: 3.2, price: '2300', rsi: 52, rsi4h: 54 },
  { id: 'SOL', name: 'Solana', performance: 5.1, price: '98', rsi: 62, rsi4h: 65 },
  { id: 'AVAX', name: 'Avalanche', performance: 4.2, price: '34', rsi: 58, rsi4h: 60 },
  { id: 'MATIC', name: 'Polygon', performance: -1.5, price: '0.85', rsi: 45, rsi4h: 42 },
];

interface UseCryptoDataOptions {
  timeframe?: string;
  rsiOverbought?: number;
  rsiOversold?: number;
}

export const useCryptoData = (options: UseCryptoDataOptions = {}) => {
  const { timeframe = '4h', rsiOverbought = 70, rsiOversold = 30 } = options;

  return useQuery({
    queryKey: ['crypto-data', timeframe, rsiOverbought, rsiOversold],
    queryFn: async () => {
      console.info('Fetching crypto data...');
      try {
        const tickers = await fetchTickers();
        if (!tickers || tickers.length === 0) {
          console.warn('No tickers received, using fallback data');
          return fallbackData;
        }
        return tickers;
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        toast.error('Erro ao carregar dados das criptomoedas. Usando dados de fallback.');
        return fallbackData;
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3,
    retryDelay: 5000,
    initialData: fallbackData
  });
};