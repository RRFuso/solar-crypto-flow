
import React, { useEffect, useMemo } from 'react';
import CryptoLogo from '@/components/ai/CryptoLogo';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CryptoData } from '@/types/crypto';
import { useTooltip } from '@/contexts/TooltipContext';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { useRealtimePrice } from '@/contexts/BinanceWebSocketContext';
import { WebSocketIndicator } from '@/components/ui/WebSocketIndicator';

interface CryptoCardProps {
  crypto: CryptoData;
  isSelected?: boolean;
  onClick?: () => void;
  showRsi?: boolean;
  showRsi4h?: boolean;
  cardClassName?: string;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ 
  crypto, 
  isSelected = false, 
  onClick, 
  showRsi = false,
  showRsi4h = false,
  cardClassName = 'bg-gray-900/50'
}) => {
  const { id, name, symbol, change24h, price, volume24h } = crypto;
  const { showTooltip, hideTooltip } = useTooltip();
  const { requestOnChainData } = useOnChainData();
  
  // WebSocket real-time price
  const wsSymbol = (symbol || id).toUpperCase();
  const realtimeTicker = useRealtimePrice(wsSymbol);
  
  // Use WebSocket price if available, fallback to prop
  const displayPrice = realtimeTicker?.price ?? price ?? 0;
  const displayVolume = realtimeTicker?.quoteVolume 
    ? realtimeTicker.quoteVolume / 1_000_000 
    : (volume24h ? volume24h / 1_000_000 : 0);
  const performance = realtimeTicker?.priceChangePercent ?? change24h ?? 0;
  const isWsConnected = !!realtimeTicker;

  // Request on-chain data for this crypto
  useEffect(() => {
    requestOnChainData([id]);
  }, [id, requestOnChainData]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    const tooltipData = {
      id,
      name,
      price: displayPrice,
      priceChange24h: performance,
      volume: volume24h
    };
    showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  return (
    <div 
      className={`flex items-center justify-between p-4 border ${isSelected ? 'border-green-500' : 'border-gray-800'} rounded-lg ${cardClassName} backdrop-blur-xl cursor-pointer hover:border-gray-700 transition-colors`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <CryptoLogo symbol={symbol || id} className="w-10 h-10 rounded-full" />
          <WebSocketIndicator isConnected={isWsConnected} className="absolute -top-1 -right-1" />
        </div>
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
        <p className="text-sm text-gray-400">Price: ${displayPrice > 0 ? displayPrice.toFixed(4) : 'N/A'}</p>
        <p className="text-sm text-gray-400">Volume (24h): ${displayVolume > 0 ? displayVolume.toFixed(2) : 'N/A'}M</p>
      </div>
    </div>
  );
};

export default CryptoCard;
