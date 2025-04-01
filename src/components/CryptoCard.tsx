import React from 'react';
import { Sparkline } from "@/components/ui/sparkline";
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { ChartConfig } from "@/components/ui/chart";

interface CryptoCardProps {
  id: string;
  name: string;
  symbol: string;
  performance: number;
  price: number;
  volume: number;
}

const THEME: ChartConfig = {
  price: {
    label: 'Price',
    color: '#10b981'
  },
  change: {
    label: '% Change',
    theme: {
      light: '#fc165b',
      dark: '#fc165b'
    }
  }
};

const CryptoCard: React.FC<CryptoCardProps> = ({ id, name, symbol, performance, price, volume }) => {
  const logoUrl = getCryptoLogoUrl(symbol);
  const fallbackLogoUrl = getFallbackLogoUrl();

  return (
    <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <img
          src={logoUrl}
          alt={`${name} Logo`}
          className="w-10 h-10 rounded-full"
          onError={(e: any) => {
            e.target.src = fallbackLogoUrl;
          }}
        />
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-400">{symbol}/USDT</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-green-500 font-bold">
          {performance > 0 ? (
            <ArrowUp className="inline-block w-4 h-4 mr-1" />
          ) : (
            <ArrowDown className="inline-block w-4 h-4 mr-1" />
          )}
          {performance.toFixed(2)}%
        </p>
        <p className="text-sm text-gray-400">Price: ${price.toFixed(2)}</p>
        <p className="text-sm text-gray-400">Volume: ${volume.toFixed(2)}M</p>
      </div>
    </div>
  );
};

export default CryptoCard;
