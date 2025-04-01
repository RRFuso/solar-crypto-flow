
import React from 'react';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CryptoData } from '@/types/crypto';

interface CryptoCardProps {
  crypto: CryptoData;
  isSelected?: boolean;
  onClick?: () => void;
  showRsi?: boolean;
  showRsi4h?: boolean;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ 
  crypto, 
  isSelected = false, 
  onClick, 
  showRsi = false,
  showRsi4h = false
}) => {
  const { id, name, symbol = id, performance = 0, price, volume } = crypto;
  const logoUrl = getCryptoLogoUrl(symbol || id);
  const fallbackLogoUrl = getFallbackLogoUrl();
  
  const displayPrice = price ? parseFloat(price) : 0;
  const displayVolume = volume ? parseFloat(volume) : 0;

  return (
    <div 
      className={`flex items-center justify-between p-4 border ${isSelected ? 'border-green-500' : 'border-gray-800'} rounded-lg bg-gray-900/50 backdrop-blur-xl cursor-pointer hover:border-gray-700 transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <img
          src={logoUrl}
          alt={`${name} Logo`}
          className="w-10 h-10 rounded-full"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = fallbackLogoUrl;
          }}
        />
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-400">{symbol || id}/USDT</p>
          
          {showRsi && crypto.rsi !== undefined && (
            <p className="text-xs text-gray-400">RSI: <span className={crypto.rsi > 70 ? 'text-red-400' : crypto.rsi < 30 ? 'text-green-400' : ''}>{crypto.rsi.toFixed(1)}</span></p>
          )}
          
          {showRsi4h && crypto.rsi4h !== undefined && (
            <p className="text-xs text-gray-400">RSI 4h: <span className={crypto.rsi4h > 70 ? 'text-red-400' : crypto.rsi4h < 30 ? 'text-green-400' : ''}>{crypto.rsi4h.toFixed(1)}</span></p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={performance > 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
          {performance > 0 ? (
            <ArrowUp className="inline-block w-4 h-4 mr-1" />
          ) : (
            <ArrowDown className="inline-block w-4 h-4 mr-1" />
          )}
          {performance.toFixed(2)}%
        </p>
        {displayPrice > 0 && <p className="text-sm text-gray-400">Price: ${displayPrice.toFixed(2)}</p>}
        {displayVolume > 0 && <p className="text-sm text-gray-400">Volume: ${displayVolume.toFixed(2)}M</p>}
      </div>
    </div>
  );
};

export default CryptoCard;
