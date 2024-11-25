import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import { useToast } from "@/hooks/use-toast";

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
}

const CryptoChart = ({ crypto, showBtcDominance = false }: CryptoChartProps) => {
  const { toast } = useToast();
  const [chartError, setChartError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Get the correct trading symbol
  const getSymbol = () => {
    if (showBtcDominance) return 'BTC.D';
    if (crypto.id === 'BTC') return 'BTCUSDT';
    return `${crypto.id}BTC`;
  };

  const symbol = getSymbol();

  // Handle chart errors and loading
  React.useEffect(() => {
    setIsLoading(true);
    setChartError(false);

    const timer = setTimeout(() => {
      const iframe = document.querySelector('iframe[id^="tradingview_"]');
      if (!iframe || iframe.clientHeight < 100) {
        setChartError(true);
        toast({
          title: "Erro ao carregar gráfico",
          description: `Não foi possível carregar o gráfico para ${crypto.name}. Retornando ao gráfico padrão.`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [crypto.id, crypto.name, toast]);

  // Reset to default chart on error
  React.useEffect(() => {
    if (chartError && crypto.id !== 'BTC') {
      toast({
        title: "Redirecionando",
        description: "Voltando ao gráfico BTC/USDT",
      });
    }
  }, [chartError, crypto.id, toast]);

  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : crypto.id === 'BTC' 
              ? 'Bitcoin (BTC/USDT)' 
              : `${crypto.name} vs Bitcoin (${crypto.id}/BTC)`}
        </h2>
      </div>
      <div className="h-[calc(100%-4rem)]">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p>Carregando gráfico...</p>
            </div>
          </div>
        )}
        {!chartError && (
          <TradingViewWidget
            symbol={`BINANCE:${symbol}`}
            theme="Dark"
            autosize
            interval="D"
            timezone="Etc/UTC"
            style="1"
            locale="pt"
            toolbar_bg="#1a1b1e"
            enable_publishing={false}
            hide_top_toolbar={false}
            allow_symbol_change={false}
            studies={["RSI@tv-basicstudies", "StochRSI@tv-basicstudies"]}
            container_id="tradingview_chart"
          />
        )}
        {chartError && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p>Gráfico não disponível para {crypto.name}</p>
              <p className="text-sm mt-2">Retornando ao gráfico padrão...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoChart;