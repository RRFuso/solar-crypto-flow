import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GaugeChart from 'react-gauge-chart';
import { Scale, Skull, PartyPopper, Bitcoin } from 'lucide-react';

interface FearGreedData {
  value: number;
  classification: string;
}

const getClassification = (value: number): string => {
  if (value <= 20) return "Medo Extremo";
  if (value <= 40) return "Medo";
  if (value <= 60) return "Neutro";
  if (value <= 80) return "Ganância";
  return "Ganância Extrema";
};

const getColors = (value: number): string[] => {
  if (value <= 20) return ["#ff0000", "#ff3333"];
  if (value <= 40) return ["#ff6600", "#ff8533"];
  if (value <= 60) return ["#ffcc00", "#ffd633"];
  if (value <= 80) return ["#00cc00", "#00e600"];
  return ["#009900", "#00b300"];
};

const getIcon = (value: number) => {
  if (value <= 40) return <Skull className="w-4 h-4 text-red-500" />;
  if (value <= 60) return <Scale className="w-4 h-4 text-yellow-500" />;
  return <PartyPopper className="w-4 h-4 text-green-500" />;
};

const getMessage = (value: number): string => {
  if (value <= 20) return "Considere uma compra ou DCA (Dollar Cost Averaging).";
  if (value >= 80) return "Considere uma realização de ganhos!";
  return "";
};

const getMessageColor = (value: number): string => {
  if (value <= 20) return "text-red-500";
  if (value >= 80) return "text-green-500";
  return "text-gray-400";
};

const FearGreedIndicator = () => {
  const { data: fearGreedData } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: async (): Promise<FearGreedData> => {
      try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        return {
          value: parseInt(data.data[0].value),
          classification: data.data[0].value_classification
        };
      } catch (error) {
        console.error('Error fetching Fear & Greed index:', error);
        return {
          value: 75,
          classification: "Ganância"
        };
      }
    },
    refetchInterval: 24 * 60 * 60 * 1000, // 24 hours
    initialData: {
      value: 75,
      classification: "Ganância"
    }
  });

  const { data: btcDominanceData } = useQuery({
    queryKey: ['btc-dominance'],
    queryFn: async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        return {
          value: parseFloat(data.data.bitcoin_dominance).toFixed(2),
        };
      } catch (error) {
        console.error('Error fetching BTC dominance:', error);
        return {
          value: "45.5"
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    initialData: {
      value: "45.5"
    }
  });

  const value = fearGreedData?.value ?? 75;
  const classification = getClassification(value);
  const colors = getColors(value);
  const message = getMessage(value);
  const messageColor = getMessageColor(value);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-4">
        <div className="w-96 space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Medo & Ganância</span>
              {getIcon(value)}
            </div>
            <span className="text-xs font-medium">{value}</span>
          </div>
          <div className="h-20">
            <GaugeChart
              id="fear-greed-gauge"
              nrOfLevels={5}
              colors={colors}
              percent={value / 100}
              textColor="#ffffff"
              formatTextValue={() => `${value}`}
              needleColor="#ffffff"
              needleBaseColor="#ffffff"
            />
          </div>
          <div className="text-center text-xs font-medium text-gray-400">
            {classification}
          </div>
          {message && (
            <div className={`text-center text-xs font-medium mt-2 ${messageColor}`}>
              {message}
            </div>
          )}
        </div>

        <div className="w-96 space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium">Dominância do Bitcoin</span>
            </div>
            <span className="text-xs font-medium">{btcDominanceData.value}%</span>
          </div>
          <div className="h-20 flex items-center justify-center">
            <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${btcDominanceData.value}%` }}
              />
            </div>
          </div>
          <div className="text-center text-xs font-medium text-gray-400">
            {parseFloat(btcDominanceData.value) > 50 ? "Alta Dominância" : "Baixa Dominância"}
          </div>
        </div>
      </div>
      <div className="text-center text-[10px] text-gray-500">
        Este painel é uma ferramenta para auxiliar sua análise. Todas as decisões de investimento são de sua responsabilidade.
      </div>
    </div>
  );
};

export default FearGreedIndicator;