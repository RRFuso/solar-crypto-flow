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
  if (value <= 40) return <Skull className="w-6 h-6 text-red-500" />;
  if (value <= 60) return <Scale className="w-6 h-6 text-yellow-500" />;
  return <PartyPopper className="w-6 h-6 text-green-500" />;
};

const FearGreedIndicator = () => {
  const { data } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: async (): Promise<FearGreedData> => {
      // Mock data - replace with actual API call
      return {
        value: Math.floor(Math.random() * 100),
        classification: "Medo"
      };
    },
    refetchInterval: 15000,
  });

  const value = data?.value ?? 50;
  const classification = getClassification(value);
  const colors = getColors(value);

  return (
    <div className="w-full space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Índice Medo & Ganância</span>
          {getIcon(value)}
        </div>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="h-32">
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
      <div className="text-center text-sm font-medium text-gray-400">
        {classification}
      </div>
    </div>
  );
};

export default FearGreedIndicator;