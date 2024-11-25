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

// Trading pairs mapping for correct TradingView symbols
const tradingViewSymbolMap = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHBTC',
  'SOL': 'SOLBTC',
  'AVAX': 'AVAXBTC',
  'MATIC': 'MATICBTC',
  'LINK': 'LINKBTC',
  'DOT': 'DOTBTC',
  'ADA': 'ADABTC',
  'DOGE': 'DOGEBTC',
  'XRP': 'XRPBTC',
  'SHIB': 'SHIBBTC',
  'LTC': 'LTCBTC',
  'UNI': 'UNIBTC',
  'ATOM': 'ATOMBTC',
  'ETC': 'ETCBTC',
  'NEAR': 'NEARBTC',
  'ALGO': 'ALGOBTC',
  'FTM': 'FTMBTC',
  'SAND': 'SANDBTC',
  'MANA': 'MANABTC',
  'PENDLE': 'PENDLEBTC',
  'JUP': 'JUPBTC',
  'INJ': 'INJBTC',
  'SUI': 'SUIBTC',
  'SEI': 'SEIBTC',
  'RENDER': 'RNDRBTC',
  'FLOKI': 'FLOKIBTC',
  'PEPE': 'PEPEBTC',
  'WIF': 'WIFBTC',
  'BONK': 'BONKBTC',
  'MEME': 'MEMEBTC',
  'MYRO': 'MYROBTC',
  'TOSHI': 'TOSHIBTC',
};

// Custom logo mappings for specific cryptocurrencies
const logoMap = {
  'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
  'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png',
};

const CryptoCard = ({ crypto, onClick, isSelected, showRsi = false, showRsi4h = false }: CryptoCardProps) => {
  const isPositive = crypto.performance > 0;
  const symbol = tradingViewSymbolMap[crypto.id] || `${crypto.id}BTC`;
  const logoUrl = logoMap[crypto.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${crypto.id}.svg`;
  
  return (
    <div
      className={cn(
        "p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors",
        isSelected ? "bg-gray-800" : "bg-gray-900",
      )}
      onClick={onClick}
      data-trading-symbol={symbol}
    >
      <div className="flex items-center gap-4">
        <img
          src={logoUrl}
          alt={`${crypto.name} logo`}
          className="w-8 h-8"
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
              "flex items-center gap-1 text-sm",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(crypto.performance).toFixed(2)}% vs BTC</span>
            </div>
          )}
          {showRsi && crypto.rsi && (
            <div className="text-sm text-gray-400">
              RSI Semanal: {crypto.rsi.toFixed(2)}
            </div>
          )}
          {showRsi4h && crypto.rsi4h && (
            <div className="text-sm text-gray-400">
              RSI 4h: {crypto.rsi4h.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;