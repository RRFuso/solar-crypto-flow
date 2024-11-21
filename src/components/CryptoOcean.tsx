import React, { useState, useRef, useEffect } from 'react';
import { FishSprite } from './ocean/FishSprite';
import { CryptoDialog } from './ocean/CryptoDialog';
import { useOceanAnimation } from './ocean/useOceanAnimation';
import { usePredatorLogic } from './ocean/usePredatorLogic';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface CryptoOceanProps {
  cryptos: Array<{
    id: string;
    name: string;
    performance: number;
  }>;
}

const CryptoOcean = ({ cryptos }: CryptoOceanProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState<(typeof cryptos)[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const fishPositions = useOceanAnimation(containerRef, cryptos.length);
  const { predatorStates, removedCryptos, checkPredation, resetTank } = usePredatorLogic(cryptos);

  useEffect(() => {
    const predationInterval = setInterval(() => {
      checkPredation();
    }, 2000);

    return () => clearInterval(predationInterval);
  }, [checkPredation]);

  const getSize = (performance: number) => {
    const minSize = 48;
    const maxSize = 144;
    const normalizedSize = Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize));
    return Math.abs(normalizedSize);
  };

  const logoMap = {
    'PENDLE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8409.png',
    'JUP': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25147.png'
  };

  return (
    <div 
      ref={containerRef}
      className="mt-8 relative bg-gradient-to-b from-blue-900/90 via-blue-950 to-blue-900/90 rounded-lg p-8 min-h-[500px] overflow-hidden shadow-2xl border border-blue-800/30"
    >
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
        {cryptos.map((crypto, index) => {
          if (removedCryptos.includes(crypto.id)) return null;
          
          const size = getSize(crypto.performance);
          const position = fishPositions[index];
          const predatorState = predatorStates[crypto.id];
          
          if (!position) return null;

          return (
            <div
              key={crypto.id}
              className={`absolute cursor-pointer transition-all duration-1000 ${
                predatorState?.isEating ? 'scale-110' : ''
              }`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transition: 'transform 0.3s ease-out, left 2s ease-in-out, top 2s ease-in-out',
              }}
              onClick={() => {
                setSelectedCrypto(crypto);
                setDialogOpen(true);
              }}
            >
              <FishSprite
                size={predatorState?.size || size}
                performance={crypto.performance}
                rotation={Math.atan2(position.velocityY, position.velocityX) * (180 / Math.PI)}
                logoUrl={logoMap[crypto.id] || `https://s3-symbol-logo.tradingview.com/crypto/XTVC${crypto.id}.svg`}
                onError={(e) => {
                  e.currentTarget.src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                }}
                isEating={predatorState?.isEating}
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 bg-gray-800/50 hover:bg-gray-700/50"
        onClick={resetTank}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <CryptoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        crypto={selectedCrypto}
      />

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