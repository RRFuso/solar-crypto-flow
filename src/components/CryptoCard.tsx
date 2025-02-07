
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
}

interface CryptoCardProps {
  crypto: CryptoData;
  onClick: () => void;
  isSelected: boolean;
  showRsi?: boolean;
  showRsi4h?: boolean;
}

const CryptoCard = ({ crypto, onClick, isSelected, showRsi = false, showRsi4h = false }: CryptoCardProps) => {
  const isPositive = crypto.performance > 0;
  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
  };
  
  return (
    <div
      className={cn(
        "p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]",
        isSelected ? "bg-gray-800/80 shadow-lg ring-1 ring-gray-700" : "bg-gray-900/50 hover:bg-gray-800/50",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <img
          src={logoMap[crypto.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${crypto.id}.svg`}
          alt={`${crypto.name} logo`}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            e.currentTarget.src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
          }}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold">{crypto.name}</span>
            <span className="text-sm text-gray-400">{crypto.id}</span>
          </div>
          {crypto.id !== 'BTC' && !showRsi && !showRsi4h && (
            <div className={cn(
              "flex items-center gap-1 text-sm mt-1",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(crypto.performance).toFixed(2)}% vs BTC</span>
            </div>
          )}
          {showRsi && crypto.rsi && (
            <div className="text-sm text-gray-400 mt-1">
              RSI Semanal: {crypto.rsi.toFixed(2)}
            </div>
          )}
          {showRsi4h && crypto.rsi4h && (
            <div className="text-sm text-gray-400 mt-1">
              RSI 4h: {crypto.rsi4h.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;
