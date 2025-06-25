
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
    <div className="w-full max-w-md space-y-2 p-6 bg-gray-900/50 rounded-lg border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon(value)}
          <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Medo & Ganância
          </span>
        </div>
        <span className="text-lg font-bold text-white">{value}</span>
      </div>
      <div className="h-28 flex justify-center mt-2">
        <GaugeChart
          id="fear-greed-gauge"
          nrOfLevels={5}
          colors={colors}
          percent={value / 100}
          textColor="#ffffff"
          formatTextValue={() => `${value}`}
          needleColor="#ffffff"
          needleBaseColor="#ffffff"
          animDelay={0}
          animateDuration={2000}
        />
      </div>
      <div className="text-center text-sm font-bold text-white my-2">
        {classification}
      </div>
      {message && (
        <div className={`text-center text-sm font-semibold mt-2 ${messageColor} drop-shadow-glow`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FearGreedGauge;
