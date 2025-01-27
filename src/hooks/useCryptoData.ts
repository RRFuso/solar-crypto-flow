import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { binanceApi } from '@/lib/binance';
import { CryptoData } from '@/types/crypto';
import { calculateRSI, calculateEMA, isAboveMA } from '@/lib/technicalAnalysis';

interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  buyBaseVolume: string;
  buyQuoteVolume: string;
  ignore: string;
}

async function fetchKlineData(symbol: string, interval: string = '4h', limit: number = 100): Promise<KlineData[]> {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`);
  const data = await response.json();
  
  return data.map((kline: any) => ({
    openTime: kline[0],
    open: kline[1],
    high: kline[2],
    low: kline[3],
    close: kline[4],
    volume: kline[5],
    closeTime: kline[6],
    quoteVolume: kline[7],
    trades: kline[8],
    buyBaseVolume: kline[9],
    buyQuoteVolume: kline[10],
    ignore: kline[11]
  }));
}

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

    // Processar cada par com indicadores técnicos
    const processedPairs = await Promise.all(usdtPairs.map(async (pair: any) => {
      const symbol = pair.symbol.replace('USDT', '');
      const performance = parseFloat(pair.priceChangePercent) - btcPerformance;

      // Buscar dados históricos para cálculos técnicos
      const klineData = await fetchKlineData(symbol);
      const closePrices = klineData.map(k => parseFloat(k.close));

      // Calcular indicadores
      const rsi = calculateRSI(closePrices);
      const rsi4h = calculateRSI(closePrices.slice(-30)); // RSI das últimas 30 velas de 4h
      const ema12 = calculateEMA(closePrices, 12);
      const ema26 = calculateEMA(closePrices, 26);
      const aboveMA14 = isAboveMA(closePrices);

      return {
        id: symbol,
        name: symbol,
        performance,
        rsi,
        rsi4h,
        ema12,
        ema26,
        aboveMA14,
        price: pair.lastPrice,
        volume: pair.volume,
        high24h: pair.highPrice,
        low24h: pair.lowPrice
      };
    }));

    return processedPairs;

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