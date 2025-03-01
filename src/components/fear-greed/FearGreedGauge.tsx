
import React from 'react';
import GaugeChart from 'react-gauge-chart';
import { Skull, Scale, PartyPopper } from 'lucide-react';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
  colors: string[];
  message: string;
  messageColor: string;
}

export const getIcon = (value: number) => {
  if (value <= 40) return <Skull className="w-4 h-4 text-red-500" />;
  if (value <= 60) return <Scale className="w-4 h-4 text-yellow-500" />;
  return <PartyPopper className="w-4 h-4 text-green-500" />;
};

const FearGreedGauge = ({ value, classification, colors, message, messageColor }: FearGreedGaugeProps) => {
  return (
    <div className="w-full max-w-md space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
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
  );
};

export default FearGreedGauge;
