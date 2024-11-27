import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GaugeChart from 'react-gauge-chart';
import { Scale, Skull, PartyPopper } from 'lucide-react';

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

const FearGreedIndicator = () => {
  const { data } = useQuery({
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

  const value = data?.value ?? 75;
  const classification = getClassification(value);
  const colors = getColors(value);

  return (
    <div className="w-full max-w-xs space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
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
    </div>
  );
};

export default FearGreedIndicator;