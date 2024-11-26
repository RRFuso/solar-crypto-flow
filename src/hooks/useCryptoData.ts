import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
}

async function fetchRSIData(symbols: string[]) {
  try {
    // Simulated API call - In production, replace with actual API endpoint
    const mockData = {
      'BTC': { rsi4h: 42.5, rsi1w: 45.2 },
      'ETH': { rsi4h: 38.6, rsi1w: 42.8 },
      'SOL': { rsi4h: 22.4, rsi1w: 72.4 },
      'JUP': { rsi4h: 18.9, rsi1w: 82.6 },
      'ICP': { rsi4h: 24.3, rsi1w: 65.8 },
      'KAS': { rsi4h: 21.8, rsi1w: 78.2 },
      'PENDLE': { rsi4h: 19.5, rsi1w: 68.9 },
      'OM': { rsi4h: 23.7, rsi1w: 58.3 },
      'INJ': { rsi4h: 17.2, rsi1w: 85.7 },
      'SUI': { rsi4h: 20.1, rsi1w: 75.4 },
      'SEI': { rsi4h: 22.8, rsi1w: 70.2 },
      'AVAX': { rsi4h: 25.6, rsi1w: 63.5 },
      'MATIC': { rsi4h: 28.4, rsi1w: 52.8 },
      'LINK': { rsi4h: 26.7, rsi1w: 61.3 },
      'NEAR': { rsi4h: 23.9, rsi1w: 64.2 },
      'RENDER': { rsi4h: 21.3, rsi1w: 69.7 },
      'FLOKI': { rsi4h: 19.8, rsi1w: 82.1 },
      'PEPE': { rsi4h: 16.5, rsi1w: 88.4 },
      'WIF': { rsi4h: 15.8, rsi1w: 86.9 },
      'DOGE': { rsi4h: 24.2, rsi1w: 75.6 },
      'BONK': { rsi4h: 14.7, rsi1w: 89.3 },
      'SHIB': { rsi4h: 20.4, rsi1w: 80.2 },
      'MEME': { rsi4h: 17.9, rsi1w: 85.8 },
      'DOGWIFHAT': { rsi4h: 16.2, rsi1w: 87.5 },
      'WOJAK': { rsi4h: 21.6, rsi1w: 79.4 },
      'MYRO': { rsi4h: 18.3, rsi1w: 83.7 },
      'TOSHI': { rsi4h: 17.5, rsi1w: 84.9 },
    };

    // In production, this would be replaced with actual API calls:
    /*
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const [response4h, response1w] = await Promise.all([
          fetch(`https://api.example.com/rsi?symbol=${symbol}&interval=4h`),
          fetch(`https://api.example.com/rsi?symbol=${symbol}&interval=1w`)
        ]);
        
        const data4h = await response4h.json();
        const data1w = await response1w.json();
        
        return {
          symbol,
          rsi4h: data4h.rsi,
          rsi1w: data1w.rsi
        };
      })
    );
    */

    return mockData;
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    throw new Error('Failed to fetch RSI data');
  }
}

const fetchCryptoData = async (): Promise<CryptoData[]> => {
  try {
    const rsiData = await fetchRSIData([
      'BTC', 'ETH', 'SOL', 'JUP', 'ICP', 'KAS', 'PENDLE', 'OM', 'INJ', 'SUI',
      'SEI', 'AVAX', 'MATIC', 'LINK', 'NEAR', 'RENDER', 'FLOKI', 'PEPE', 'WIF',
      'DOGE', 'BONK', 'SHIB', 'MEME', 'DOGWIFHAT', 'WOJAK', 'MYRO', 'TOSHI'
    ]);

    return [
      { id: 'BTC', name: 'Bitcoin', performance: 0, rsi: rsiData['BTC'].rsi1w, rsi4h: rsiData['BTC'].rsi4h },
      { id: 'ETH', name: 'Ethereum', performance: -12.5, rsi: rsiData['ETH'].rsi1w, rsi4h: rsiData['ETH'].rsi4h },
      { id: 'SOL', name: 'Solana', performance: 45.2, rsi: rsiData['SOL'].rsi1w, rsi4h: rsiData['SOL'].rsi4h },
      { id: 'JUP', name: 'Jupiter', performance: 156.7, rsi: rsiData['JUP'].rsi1w, rsi4h: rsiData['JUP'].rsi4h },
      { id: 'ICP', name: 'Internet Computer', performance: 89.3, rsi: rsiData['ICP'].rsi1w, rsi4h: rsiData['ICP'].rsi4h },
      { id: 'KAS', name: 'Kaspa', performance: 234.1, rsi: rsiData['KAS'].rsi1w, rsi4h: rsiData['KAS'].rsi4h },
      { id: 'PENDLE', name: 'Pendle', performance: 167.3, rsi: rsiData['PENDLE'].rsi1w, rsi4h: rsiData['PENDLE'].rsi4h },
      { id: 'OM', name: 'Mantra', performance: 78.4, rsi: rsiData['OM'].rsi1w, rsi4h: rsiData['OM'].rsi4h },
      { id: 'INJ', name: 'Injective', performance: 321.5, rsi: rsiData['INJ'].rsi1w, rsi4h: rsiData['INJ'].rsi4h },
      { id: 'SUI', name: 'Sui', performance: 145.8, rsi: rsiData['SUI'].rsi1w, rsi4h: rsiData['SUI'].rsi4h },
      { id: 'SEI', name: 'Sei', performance: 178.9, rsi: rsiData['SEI'].rsi1w, rsi4h: rsiData['SEI'].rsi4h },
      { id: 'AVAX', name: 'Avalanche', performance: 67.2, rsi: rsiData['AVAX'].rsi1w, rsi4h: rsiData['AVAX'].rsi4h },
      { id: 'MATIC', name: 'Polygon', performance: 23.4, rsi: rsiData['MATIC'].rsi1w, rsi4h: rsiData['MATIC'].rsi4h },
      { id: 'LINK', name: 'Chainlink', performance: 45.6, rsi: rsiData['LINK'].rsi1w, rsi4h: rsiData['LINK'].rsi4h },
      { id: 'NEAR', name: 'Near Protocol', performance: 56.7, rsi: rsiData['NEAR'].rsi1w, rsi4h: rsiData['NEAR'].rsi4h },
      { id: 'RENDER', name: 'Render', performance: 89.2, rsi: rsiData['RENDER'].rsi1w, rsi4h: rsiData['RENDER'].rsi4h },
      { id: 'FLOKI', name: 'Floki Inu', performance: 234.5, rsi: rsiData['FLOKI'].rsi1w, rsi4h: rsiData['FLOKI'].rsi4h },
      { id: 'PEPE', name: 'Pepe', performance: 345.6, rsi: rsiData['PEPE'].rsi1w, rsi4h: rsiData['PEPE'].rsi4h },
      { id: 'WIF', name: 'Wif', performance: 456.7, rsi: rsiData['WIF'].rsi1w, rsi4h: rsiData['WIF'].rsi4h },
      { id: 'DOGE', name: 'Dogecoin', performance: 123.4, rsi: rsiData['DOGE'].rsi1w, rsi4h: rsiData['DOGE'].rsi4h },
      { id: 'BONK', name: 'Bonk', performance: 567.8, rsi: rsiData['BONK'].rsi1w, rsi4h: rsiData['BONK'].rsi4h },
      { id: 'SHIB', name: 'Shiba Inu', performance: 234.5, rsi: rsiData['SHIB'].rsi1w, rsi4h: rsiData['SHIB'].rsi4h },
      { id: 'MEME', name: 'Memecoin', performance: 345.6, rsi: rsiData['MEME'].rsi1w, rsi4h: rsiData['MEME'].rsi4h },
      { id: 'DOGWIFHAT', name: 'Dog Wif Hat', performance: 456.7, rsi: rsiData['DOGWIFHAT'].rsi1w, rsi4h: rsiData['DOGWIFHAT'].rsi4h },
      { id: 'WOJAK', name: 'Wojak', performance: 234.5, rsi: rsiData['WOJAK'].rsi1w, rsi4h: rsiData['WOJAK'].rsi4h },
      { id: 'MYRO', name: 'Myro', performance: 345.6, rsi: rsiData['MYRO'].rsi1w, rsi4h: rsiData['MYRO'].rsi4h },
      { id: 'TOSHI', name: 'Toshi', performance: 456.7, rsi: rsiData['TOSHI'].rsi1w, rsi4h: rsiData['TOSHI'].rsi4h },
    ];
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw new Error('Failed to fetch crypto data');
  }
};

export const useCryptoData = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
    retry: 3,
    onError: () => {
      toast({
        title: "Erro ao atualizar dados",
        description: "Não foi possível obter as atualizações em tempo real",
        variant: "destructive",
      });
    }
  });
};