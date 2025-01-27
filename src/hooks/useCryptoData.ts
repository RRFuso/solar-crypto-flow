import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { binanceApi } from '@/lib/binance';
import { CryptoData } from '@/types/crypto';

async function fetchBinanceData(): Promise<CryptoData[]> {
  try {
    // Buscar tickers de 24h
    const tickers = await binanceApi.getTickerPrice();
    const dayStats = await binanceApi.get24hrTickerPrice();

    // Filtrar apenas pares USDT
    const usdtPairs = dayStats.filter((pair: any) => 
      pair.symbol.endsWith('USDT') && 
      !pair.symbol.includes('UP') && 
      !pair.symbol.includes('DOWN')
    );

    // Encontrar BTC performance para comparação
    const btcStats = usdtPairs.find((pair: any) => pair.symbol === 'BTCUSDT');
    const btcPerformance = btcStats ? parseFloat(btcStats.priceChangePercent) : 0;

    // Transformar dados no formato necessário
    return usdtPairs.map((pair: any) => {
      const symbol = pair.symbol.replace('USDT', '');
      const performance = parseFloat(pair.priceChangePercent) - btcPerformance;

      return {
        id: symbol,
        name: symbol,
        performance,
        rsi: 50, // Placeholder - será implementado na próxima etapa
        rsi4h: 50, // Placeholder - será implementado na próxima etapa
        aboveMA14: false, // Placeholder - será implementado na próxima etapa
      };
    });
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    throw new Error('Failed to fetch market data');
  }
}

export const useCryptoData = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchBinanceData,
    refetchInterval: 15000, // Atualiza a cada 15 segundos
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