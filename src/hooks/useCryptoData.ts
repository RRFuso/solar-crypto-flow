import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
  aboveMA14?: boolean;
}

async function fetchRSIData(symbols: string[]) {
  try {
    // Simulated API call - In production, replace with actual API endpoint
    const mockData = {
      'BTC': { rsi1w: 45.2, rsi4h: 42.5 },
      'ETH': { rsi1w: 42.8, rsi4h: 38.6 },
      'SOL': { rsi1w: 72.4, rsi4h: 22.4 },
      'JUP': { rsi1w: 82.6, rsi4h: 18.9 },
      'ICP': { rsi1w: 65.8, rsi4h: 24.3 },
      'KAS': { rsi1w: 78.2, rsi4h: 21.8 },
      'PENDLE': { rsi1w: 68.9, rsi4h: 19.5 },
      'OM': { rsi1w: 58.3, rsi4h: 23.7 },
      'INJ': { rsi1w: 85.7, rsi4h: 17.2 },
      'SUI': { rsi1w: 75.4, rsi4h: 20.1 },
      'SEI': { rsi1w: 70.2, rsi4h: 22.8 },
      'AVAX': { rsi1w: 63.5, rsi4h: 25.6 },
      'MATIC': { rsi1w: 52.8, rsi4h: 28.4 },
      'LINK': { rsi1w: 61.3, rsi4h: 26.7 },
      'NEAR': { rsi1w: 64.2, rsi4h: 23.9 },
      'RENDER': { rsi1w: 69.7, rsi4h: 21.3 },
      'FLOKI': { rsi1w: 82.1, rsi4h: 19.8 },
      'PEPE': { rsi1w: 88.4, rsi4h: 16.5 },
      'WIF': { rsi1w: 86.9, rsi4h: 15.8 },
      'DOGE': { rsi1w: 75.6, rsi4h: 24.2 },
      'BONK': { rsi1w: 89.3, rsi4h: 14.7 },
      'SHIB': { rsi1w: 80.2, rsi4h: 20.4 },
      'MEME': { rsi1w: 85.8, rsi4h: 17.9 },
      'DOGWIFHAT': { rsi1w: 87.5, rsi4h: 16.2 },
      'WOJAK': { rsi1w: 79.4, rsi4h: 21.6 },
      'MYRO': { rsi1w: 83.7, rsi4h: 18.3 },
      'TOSHI': { rsi1w: 84.9, rsi4h: 17.5 },
    };

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

    // Mock MA14 data - In production, replace with actual API call
    const mockMA14Data = (performance: number) => Math.random() > 0.5;

    return [
      { id: 'BTC', name: 'Bitcoin', performance: 0, rsi: rsiData['BTC'].rsi1w, rsi4h: rsiData['BTC'].rsi4h, aboveMA14: mockMA14Data(0) },
      { id: 'ETH', name: 'Ethereum', performance: -12.5, rsi: rsiData['ETH'].rsi1w, rsi4h: rsiData['ETH'].rsi4h, aboveMA14: mockMA14Data(-12.5) },
      { id: 'SOL', name: 'Solana', performance: 45.2, rsi: rsiData['SOL'].rsi1w, rsi4h: rsiData['SOL'].rsi4h, aboveMA14: mockMA14Data(45.2) },
      { id: 'JUP', name: 'Jupiter', performance: 156.7, rsi: rsiData['JUP'].rsi1w, rsi4h: rsiData['JUP'].rsi4h, aboveMA14: mockMA14Data(156.7) },
      { id: 'ICP', name: 'Internet Computer', performance: 89.3, rsi: rsiData['ICP'].rsi1w, rsi4h: rsiData['ICP'].rsi4h, aboveMA14: mockMA14Data(89.3) },
      { id: 'KAS', name: 'Kaspa', performance: 234.1, rsi: rsiData['KAS'].rsi1w, rsi4h: rsiData['KAS'].rsi4h, aboveMA14: mockMA14Data(234.1) },
      { id: 'PENDLE', name: 'Pendle', performance: 167.3, rsi: rsiData['PENDLE'].rsi1w, rsi4h: rsiData['PENDLE'].rsi4h, aboveMA14: mockMA14Data(167.3) },
      { id: 'OM', name: 'Mantra', performance: 78.4, rsi: rsiData['OM'].rsi1w, rsi4h: rsiData['OM'].rsi4h, aboveMA14: mockMA14Data(78.4) },
      { id: 'INJ', name: 'Injective', performance: 321.5, rsi: rsiData['INJ'].rsi1w, rsi4h: rsiData['INJ'].rsi4h, aboveMA14: mockMA14Data(321.5) },
      { id: 'SUI', name: 'Sui', performance: 145.8, rsi: rsiData['SUI'].rsi1w, rsi4h: rsiData['SUI'].rsi4h, aboveMA14: mockMA14Data(145.8) },
      { id: 'SEI', name: 'Sei', performance: 178.9, rsi: rsiData['SEI'].rsi1w, rsi4h: rsiData['SEI'].rsi4h, aboveMA14: mockMA14Data(178.9) },
      { id: 'AVAX', name: 'Avalanche', performance: 67.2, rsi: rsiData['AVAX'].rsi1w, rsi4h: rsiData['AVAX'].rsi4h, aboveMA14: mockMA14Data(67.2) },
      { id: 'MATIC', name: 'Polygon', performance: 23.4, rsi: rsiData['MATIC'].rsi1w, rsi4h: rsiData['MATIC'].rsi4h, aboveMA14: mockMA14Data(23.4) },
      { id: 'LINK', name: 'Chainlink', performance: 45.6, rsi: rsiData['LINK'].rsi1w, rsi4h: rsiData['LINK'].rsi4h, aboveMA14: mockMA14Data(45.6) },
      { id: 'NEAR', name: 'Near Protocol', performance: 56.7, rsi: rsiData['NEAR'].rsi1w, rsi4h: rsiData['NEAR'].rsi4h, aboveMA14: mockMA14Data(56.7) },
      { id: 'RENDER', name: 'Render', performance: 89.2, rsi: rsiData['RENDER'].rsi1w, rsi4h: rsiData['RENDER'].rsi4h, aboveMA14: mockMA14Data(89.2) },
      { id: 'FLOKI', name: 'Floki Inu', performance: 234.5, rsi: rsiData['FLOKI'].rsi1w, rsi4h: rsiData['FLOKI'].rsi4h, aboveMA14: mockMA14Data(234.5) },
      { id: 'PEPE', name: 'Pepe', performance: 345.6, rsi: rsiData['PEPE'].rsi1w, rsi4h: rsiData['PEPE'].rsi4h, aboveMA14: mockMA14Data(345.6) },
      { id: 'WIF', name: 'Wif', performance: 456.7, rsi: rsiData['WIF'].rsi1w, rsi4h: rsiData['WIF'].rsi4h, aboveMA14: mockMA14Data(456.7) },
      { id: 'DOGE', name: 'Dogecoin', performance: 123.4, rsi: rsiData['DOGE'].rsi1w, rsi4h: rsiData['DOGE'].rsi4h, aboveMA14: mockMA14Data(123.4) },
      { id: 'BONK', name: 'Bonk', performance: 567.8, rsi: rsiData['BONK'].rsi1w, rsi4h: rsiData['BONK'].rsi4h, aboveMA14: mockMA14Data(567.8) },
      { id: 'SHIB', name: 'Shiba Inu', performance: 234.5, rsi: rsiData['SHIB'].rsi1w, rsi4h: rsiData['SHIB'].rsi4h, aboveMA14: mockMA14Data(234.5) },
      { id: 'MEME', name: 'Memecoin', performance: 345.6, rsi: rsiData['MEME'].rsi1w, rsi4h: rsiData['MEME'].rsi4h, aboveMA14: mockMA14Data(345.6) },
      { id: 'DOGWIFHAT', name: 'Dog Wif Hat', performance: 456.7, rsi: rsiData['DOGWIFHAT'].rsi1w, rsi4h: rsiData['DOGWIFHAT'].rsi4h, aboveMA14: mockMA14Data(456.7) },
      { id: 'WOJAK', name: 'Wojak', performance: 234.5, rsi: rsiData['WOJAK'].rsi1w, rsi4h: rsiData['WOJAK'].rsi4h, aboveMA14: mockMA14Data(234.5) },
      { id: 'MYRO', name: 'Myro', performance: 345.6, rsi: rsiData['MYRO'].rsi1w, rsi4h: rsiData['MYRO'].rsi4h, aboveMA14: mockMA14Data(345.6) },
      { id: 'TOSHI', name: 'Toshi', performance: 456.7, rsi: rsiData['TOSHI'].rsi1w, rsi4h: rsiData['TOSHI'].rsi4h, aboveMA14: mockMA14Data(456.7) },
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
    refetchInterval: 15000,
    staleTime: 2000,
    retry: 3,
    meta: {
      onError: () => {
        toast({
          title: "Erro ao atualizar dados",
          description: "Não foi possível obter as atualizações em tempo real",
          variant: "destructive",
        });
      }
    }
  });
};