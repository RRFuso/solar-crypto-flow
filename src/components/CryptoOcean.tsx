import React, { useState, useEffect } from 'react';
import { Fish } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CryptoOceanProps {
  cryptos: Array<{
    id: string;
    name: string;
    performance: number;
  }>;
}

interface FishPosition {
  [key: string]: { left: string; top: string };
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<(typeof cryptos)[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [positions, setPositions] = useState<FishPosition>({});

  const getSize = (performance: number) => {
    const minSize = 24;
    const maxSize = 96;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  const getRandomPosition = (index: number) => {
    const totalItems = cryptos.length;
    const columns = Math.ceil(Math.sqrt(totalItems));
    const rows = Math.ceil(totalItems / columns);
    const cellWidth = 80 / columns;
    const cellHeight = 75 / rows;
    
    const row = Math.floor(index / columns);
    const verticalZone = Math.floor((row * 3) / rows);
    const baseY = (verticalZone * 30) + (row * cellHeight / 3);
    
    // Increased random variation for more natural movement
    const randomX = Math.random() * 70 + 10; // Between 10% and 80%
    const randomY = baseY + (Math.random() - 0.5) * 20; // Variation within vertical zone
    
    return {
      left: `${randomX}%`,
      top: `${randomY}%`,
    };
  };

  // Initialize positions
  useEffect(() => {
    const initialPositions: FishPosition = {};
    cryptos.forEach((crypto, index) => {
      initialPositions[crypto.id] = getRandomPosition(index);
    });
    setPositions(initialPositions);
  }, [cryptos.length]);

  // Update positions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prevPositions => {
        const newPositions: FishPosition = {};
        cryptos.forEach((crypto, index) => {
          newPositions[crypto.id] = getRandomPosition(index);
        });
        return newPositions;
      });
    }, 5000); // Move every 5 seconds

    return () => clearInterval(interval);
  }, [cryptos.length]);

  const handleFishClick = (crypto: (typeof cryptos)[0]) => {
    setSelectedCrypto(crypto);
    setDialogOpen(true);
    // Update position on click
    setPositions(prev => ({
      ...prev,
      [crypto.id]: getRandomPosition(cryptos.findIndex(c => c.id === crypto.id))
    }));
  };

  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
  };

  return (
    <div className="mt-8 relative bg-gradient-to-b from-blue-900/90 via-blue-950 to-blue-900/90 rounded-lg p-8 min-h-[500px] overflow-hidden shadow-2xl border border-blue-800/30">
      {/* Background bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bg-blue-400/10 rounded-full"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              left: `${Math.random() * 100}%`,
              animation: `bubble ${Math.random() * 10 + 5}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Light reflection */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-300/5 to-transparent transform -skew-y-6" />
      
      <div className="relative z-10">
        {cryptos.map((crypto) => {
          const size = getSize(crypto.performance);
          const position = positions[crypto.id] || { left: '50%', top: '50%' };
          
          return (
            <div
              key={crypto.id}
              className="absolute group cursor-pointer"
              style={{
                ...position,
                transition: 'all 3s ease-in-out',
              }}
              onClick={() => handleFishClick(crypto)}
            >
              <div className="relative">
                <Fish
                  className={`transform transition-all duration-300 ${
                    crypto.performance < 0 ? 'rotate-180' : ''
                  } text-white/80 group-hover:text-white`}
                  style={{
                    width: size,
                    height: size,
                  }}
                />
                <img
                  src={logoMap[crypto.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${crypto.id}.svg`}
                  alt={`${crypto.name} logo`}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-white/10 p-1"
                  onError={(e) => {
                    e.currentTarget.src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedCrypto?.name} ({selectedCrypto?.id})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Performance vs BTC:</span>
              <span className={selectedCrypto?.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {selectedCrypto?.performance.toFixed(2)}%
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes bubble {
            0% {
              transform: translateY(100vh) scale(1);
              opacity: 0.8;
            }
            100% {
              transform: translateY(-100px) scale(1.5);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CryptoOcean;