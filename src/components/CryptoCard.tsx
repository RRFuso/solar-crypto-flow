
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
    'BTC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    'ETH': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    'SOL': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png',
    'XRP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
    'ADA': 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
    'DOGE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    'AVAX': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    'SHIB': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    'LINK': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    'DOT': 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
    'MATIC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
    'LTC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/2.png',
    'UNI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
    'BNB': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'
  };
  
  return (
    <div
      className={cn(
        "p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors",
        isSelected ? "bg-gray-800" : "bg-gray-900",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <img
          src={logoMap[crypto.id] || `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoinIdForSymbol(crypto.id)}.png`}
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

// Helper function to map crypto symbols to CoinMarketCap IDs
const getCoinIdForSymbol = (symbol: string): number => {
  const symbolToId: Record<string, number> = {
    'BTC': 1,
    'ETH': 1027,
    'SOL': 5426,
    'BNB': 1839,
    'XRP': 52,
    'ADA': 2010,
    'AVAX': 5805,
    'DOT': 6636,
    'DOGE': 74,
    'MATIC': 3890,
    'LINK': 1975,
    'UNI': 7083,
    'SHIB': 5994,
    'TRX': 1958,
    'TON': 11419,
    'ICP': 8916,
    'NEAR': 6535,
    'APT': 21794,
    'ARB': 11841,
    'OP': 11840,
    'FIL': 2280,
    'SUI': 20947,
    'ALGO': 4030,
    'ATOM': 3794,
    'MANA': 1966,
    'SEI': 20947,
    'GRT': 6719,
    'AAVE': 7278,
    'MKR': 1518,
    'CRV': 6538,
    'COMP': 5692,
    'SNX': 2586,
    'LDO': 8000,
    'RUNE': 4157,
    'FXS': 6953,
    'PENDLE': 8409,
    'JUP': 25147,
    'INJ': 7226,
    'ARKM': 25508,
    'SUI': 20947,
    'BLUR': 23121,
    'TIA': 28869,
    'STX': 4847,
    'IMX': 10603,
    'WIF': 27867,
    'ORDI': 27889
  };
  
  return symbolToId[symbol] || 1;
};

export default CryptoCard;
